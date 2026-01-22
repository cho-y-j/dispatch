package com.dispatch.dto.admin;

import com.dispatch.entity.Suspension;
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
public class SuspensionResponse {

    private Long id;
    private Long userId;
    private String userName;
    private Warning.UserType userType;
    private Suspension.SuspensionType type;
    private String reason;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Boolean isActive;
    private Long createdBy;
    private String createdByName;
    private LocalDateTime createdAt;
    private Long liftedBy;
    private LocalDateTime liftedAt;

    public static SuspensionResponse from(Suspension suspension) {
        return SuspensionResponse.builder()
                .id(suspension.getId())
                .userId(suspension.getUserId())
                .userType(suspension.getUserType())
                .type(suspension.getType())
                .reason(suspension.getReason())
                .startDate(suspension.getStartDate())
                .endDate(suspension.getEndDate())
                .isActive(suspension.getIsActive())
                .createdBy(suspension.getCreatedBy())
                .createdAt(suspension.getCreatedAt())
                .liftedBy(suspension.getLiftedBy())
                .liftedAt(suspension.getLiftedAt())
                .build();
    }
}
