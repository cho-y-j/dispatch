package com.dispatch.dto.websocket;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebSocketMessage<T> {

    private MessageType type;
    private String title;
    private String message;
    private T data;
    private LocalDateTime timestamp;

    public enum MessageType {
        // 배차 관련
        NEW_DISPATCH,           // 새 배차 등록됨 (기사에게)
        DISPATCH_ACCEPTED,      // 배차 수락됨 (직원에게)
        DISPATCH_ARRIVED,       // 기사 현장 도착 (직원에게)
        DISPATCH_COMPLETED,     // 작업 완료 (직원에게)
        DISPATCH_CANCELLED,     // 배차 취소됨

        // 기사 관련
        DRIVER_APPROVED,        // 기사 승인됨 (기사에게)
        DRIVER_REJECTED,        // 기사 거절됨 (기사에게)

        // 위치 관련
        LOCATION_UPDATE,        // 기사 위치 업데이트 (직원에게)

        // 채팅 관련
        CHAT_MESSAGE,           // 채팅 메시지

        // 시스템
        SYSTEM_NOTICE           // 시스템 공지
    }

    public static <T> WebSocketMessage<T> of(MessageType type, String title, String message, T data) {
        return WebSocketMessage.<T>builder()
                .type(type)
                .title(title)
                .message(message)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }
}
