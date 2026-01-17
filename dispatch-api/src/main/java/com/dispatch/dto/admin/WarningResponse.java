package com.dispatch.dto.admin;

import com.dispatch.entity.Warning;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarningResponse {

    private Long id;
    private Long userId;
    private String userName;
    private Warning.UserType userType;
    private Warning.WarningType type;
    private String reason;
    private Long dispatchId;
    private Long createdBy;
    private String createdByName;
    private LocalDateTime createdAt;

    public static WarningResponse from(Warning warning) {
        return WarningResponse.builder()
                .id(warning.getId())
                .userId(warning.getUserId())
                .userType(warning.getUserType())
                .type(warning.getType())
                .reason(warning.getReason())
                .dispatchId(warning.getDispatchId())
                .createdBy(warning.getCreatedBy())
                .createdAt(warning.getCreatedAt())
                .build();
    }
}
