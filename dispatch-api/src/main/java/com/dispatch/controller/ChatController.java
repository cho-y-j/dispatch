package com.dispatch.controller;

import com.dispatch.dto.ApiResponse;
import com.dispatch.dto.chat.ChatMessageRequest;
import com.dispatch.dto.chat.ChatMessageResponse;
import com.dispatch.security.CustomUserDetails;
import com.dispatch.service.ChatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dispatches/{dispatchId}/chat")
@RequiredArgsConstructor
@Tag(name = "채팅", description = "배차 관련 채팅 API")
public class ChatController {

    private final ChatService chatService;

    @GetMapping("/messages")
    @Operation(summary = "채팅 메시지 조회", description = "배차 관련 채팅 메시지 목록을 조회합니다")
    public ResponseEntity<ApiResponse<List<ChatMessageResponse>>> getMessages(
            @PathVariable Long dispatchId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        List<ChatMessageResponse> messages = chatService.getMessages(dispatchId, userDetails.getUserId());
        return ResponseEntity.ok(ApiResponse.success(messages));
    }

    @PostMapping("/messages")
    @Operation(summary = "메시지 전송", description = "채팅 메시지를 전송합니다")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> sendMessage(
            @PathVariable Long dispatchId,
            @Valid @RequestBody ChatMessageRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        ChatMessageResponse response = chatService.sendMessage(dispatchId, request, userDetails.getUserId());
        return ResponseEntity.ok(ApiResponse.success("메시지가 전송되었습니다", response));
    }

    @PutMapping("/messages/read")
    @Operation(summary = "읽음 처리", description = "채팅 메시지를 읽음 처리합니다")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable Long dispatchId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        chatService.markAsRead(dispatchId, userDetails.getUserId());
        return ResponseEntity.ok(ApiResponse.success("읽음 처리되었습니다", null));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "읽지 않은 메시지 수", description = "읽지 않은 메시지 수를 조회합니다")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> getUnreadCount(
            @PathVariable Long dispatchId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        int count = chatService.getUnreadCount(dispatchId, userDetails.getUserId());
        return ResponseEntity.ok(ApiResponse.success(Map.of("unreadCount", count)));
    }
}
