package com.dispatch.dto.chat;

import com.dispatch.entity.ChatMessage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageResponse {

    private Long id;
    private Long dispatchId;
    private Long senderId;
    private String senderName;
    private ChatMessage.SenderType senderType;
    private String message;
    private String imageUrl;
    private Boolean isRead;
    private LocalDateTime readAt;
    private LocalDateTime createdAt;

    public static ChatMessageResponse from(ChatMessage chatMessage) {
        return ChatMessageResponse.builder()
                .id(chatMessage.getId())
                .dispatchId(chatMessage.getDispatchId())
                .senderId(chatMessage.getSenderId())
                .senderType(chatMessage.getSenderType())
                .message(chatMessage.getMessage())
                .imageUrl(chatMessage.getImageUrl())
                .isRead(chatMessage.getIsRead())
                .readAt(chatMessage.getReadAt())
                .createdAt(chatMessage.getCreatedAt())
                .build();
    }
}
