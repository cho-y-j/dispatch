package com.dispatch.dto.verify;

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
public class DriverVerificationSummary {

    private Long driverId;
    private String driverName;
    private String phone;
    private String email;
    private String businessRegistrationNumber;
    private String driverLicenseNumber;

    // 각 검증 항목별 상태
    private VerificationItemStatus licenseStatus;
    private VerificationItemStatus businessStatus;
    private VerificationItemStatus koshaStatus;
    private VerificationItemStatus cargoStatus;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VerificationItemStatus {
        private String result;      // VALID, INVALID, UNKNOWN, NOT_VERIFIED
        private String reasonCode;
        private String message;
        private LocalDateTime verifiedAt;
    }
}
