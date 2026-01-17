package com.dispatch.service;

import com.dispatch.dto.chat.ChatMessageRequest;
import com.dispatch.dto.chat.ChatMessageResponse;
import com.dispatch.dto.websocket.WebSocketMessage;
import com.dispatch.entity.ChatMessage;
import com.dispatch.entity.DispatchMatch;
import com.dispatch.entity.User;
import com.dispatch.exception.CustomException;
import com.dispatch.repository.ChatMessageRepository;
import com.dispatch.repository.DispatchMatchRepository;
import com.dispatch.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final DispatchMatchRepository dispatchMatchRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * 메시지 전송
     */
    @Transactional
    public ChatMessageResponse sendMessage(Long dispatchId, ChatMessageRequest request, Long senderId) {
        // 배차 매칭 확인
        DispatchMatch match = dispatchMatchRepository.findByDispatchRequestId(dispatchId)
                .orElseThrow(() -> CustomException.notFound("매칭된 배차가 아닙니다"));

        // 발신자 정보 확인
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> CustomException.notFound("사용자를 찾을 수 없습니다"));

        // 발신자 유형 결정
        ChatMessage.SenderType senderType;
        if (sender.getRole() == User.UserRole.DRIVER) {
            senderType = ChatMessage.SenderType.DRIVER;
        } else if (sender.getRole() == User.UserRole.COMPANY || sender.getRole() == User.UserRole.STAFF) {
            senderType = ChatMessage.SenderType.COMPANY;
        } else {
            throw CustomException.forbidden("채팅 권한이 없습니다");
        }

        ChatMessage message = ChatMessage.builder()
                .dispatchId(dispatchId)
                .senderId(senderId)
                .senderType(senderType)
                .message(request.getMessage())
                .imageUrl(request.getImageUrl())
                .isRead(false)
                .build();

        chatMessageRepository.save(message);

        ChatMessageResponse response = buildChatMessageResponse(message, sender.getName());

        // WebSocket으로 실시간 전송
        sendWebSocketMessage(dispatchId, response);

        log.info("Chat message sent: dispatchId={}, senderId={}", dispatchId, senderId);

        return response;
    }

    /**
     * 채팅 메시지 목록 조회
     */
    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getMessages(Long dispatchId, Long userId) {
        // 배차 매칭 확인
        dispatchMatchRepository.findByDispatchRequestId(dispatchId)
                .orElseThrow(() -> CustomException.notFound("매칭된 배차가 아닙니다"));

        return chatMessageRepository.findByDispatchIdOrderByCreatedAtAsc(dispatchId)
                .stream()
                .map(msg -> {
                    String senderName = userRepository.findById(msg.getSenderId())
                            .map(User::getName)
                            .orElse("Unknown");
                    return buildChatMessageResponse(msg, senderName);
                })
                .toList();
    }

    /**
     * 읽음 처리
     */
    @Transactional
    public void markAsRead(Long dispatchId, Long userId) {
        int updated = chatMessageRepository.markAsRead(dispatchId, userId, LocalDateTime.now());
        log.info("Messages marked as read: dispatchId={}, userId={}, count={}", dispatchId, userId, updated);
    }

    /**
     * 읽지 않은 메시지 수 조회
     */
    @Transactional(readOnly = true)
    public int getUnreadCount(Long dispatchId, Long userId) {
        return chatMessageRepository.countUnreadMessages(dispatchId, userId);
    }

    /**
     * 특정 시간 이후 메시지 조회 (폴링용)
     */
    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getMessagesSince(Long dispatchId, LocalDateTime since) {
        return chatMessageRepository.findMessagesSince(dispatchId, since)
                .stream()
                .map(msg -> {
                    String senderName = userRepository.findById(msg.getSenderId())
                            .map(User::getName)
                            .orElse("Unknown");
                    return buildChatMessageResponse(msg, senderName);
                })
                .toList();
    }

    private ChatMessageResponse buildChatMessageResponse(ChatMessage message, String senderName) {
        ChatMessageResponse response = ChatMessageResponse.from(message);
        response.setSenderName(senderName);
        return response;
    }

    private void sendWebSocketMessage(Long dispatchId, ChatMessageResponse message) {
        WebSocketMessage<ChatMessageResponse> wsMessage = WebSocketMessage.<ChatMessageResponse>builder()
                .type(WebSocketMessage.MessageType.CHAT_MESSAGE)
                .data(message)
                .timestamp(LocalDateTime.now())
                .build();

        messagingTemplate.convertAndSend("/topic/chat/" + dispatchId, wsMessage);
    }
}
