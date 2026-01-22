package com.dispatch.dto.verify;

import com.dispatch.entity.DriverVerification;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DriverVerificationResponse {

    private Long id;
    private Long driverId;
    private String verificationType;
    private String result;
    private String reasonCode;
    private String message;
    private Long verifiedBy;
    private LocalDateTime createdAt;

    public static DriverVerificationResponse from(DriverVerification entity) {
        return DriverVerificationResponse.builder()
                .id(entity.getId())
                .driverId(entity.getDriver().getId())
                .verificationType(entity.getVerificationType().name())
                .result(entity.getResult().name())
                .reasonCode(entity.getReasonCode())
                .message(entity.getMessage())
                .verifiedBy(entity.getVerifiedBy())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
