package com.dispatch.dto.dispatch;

import com.dispatch.entity.DispatchMatch;
import com.dispatch.entity.DispatchRequest;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkReportResponse {

    private Long dispatchId;
    private Long matchId;

    // 배차 정보
    private String siteAddress;
    private String siteDetail;
    private LocalDate workDate;
    private String workTime;
    private String equipmentTypeName;
    private String workDescription;

    // 발주처 정보
    private Long companyId;
    private String companyName;
    private String staffName;
    private String staffPhone;

    // 기사 정보
    private Long driverId;
    private String driverName;
    private String driverPhone;

    // 요금
    private BigDecimal originalPrice;
    private BigDecimal finalPrice;

    // 작업 시간
    private LocalDateTime matchedAt;
    private LocalDateTime departedAt;
    private LocalDateTime arrivedAt;
    private LocalDateTime workStartedAt;
    private LocalDateTime completedAt;

    // 서명 - 기사
    private String driverSignature;
    private LocalDateTime driverSignedAt;

    // 서명 - 현장 담당자
    private String clientSignature;
    private String clientName;
    private LocalDateTime clientSignedAt;

    // 서명 - 발주처 확인
    private String companySignature;
    private String companySignedBy;
    private LocalDateTime companySignedAt;
    private Boolean companyConfirmed;

    // 작업 메모 및 확인서
    private String workNotes;
    private String workReportUrl;
    private String workPhotos;

    // 상태
    private String status;
    private String dispatchStatus;

    public static WorkReportResponse from(DispatchRequest dispatch, DispatchMatch match) {
        if (match == null) {
            return null;
        }

        return WorkReportResponse.builder()
                .dispatchId(dispatch.getId())
                .matchId(match.getId())
                // 배차 정보
                .siteAddress(dispatch.getSiteAddress())
                .siteDetail(dispatch.getSiteDetail())
                .workDate(dispatch.getWorkDate())
                .workTime(dispatch.getWorkTime() != null ? dispatch.getWorkTime().toString() : null)
                .equipmentTypeName(dispatch.getEquipmentType() != null ?
                        dispatch.getEquipmentType().getDisplayName() : null)
                .workDescription(dispatch.getWorkDescription())
                // 발주처 정보
                .companyId(dispatch.getCompany() != null ? dispatch.getCompany().getId() : null)
                .companyName(dispatch.getCompany() != null ? dispatch.getCompany().getName() : null)
                .staffName(dispatch.getStaff().getName())
                .staffPhone(dispatch.getStaff().getPhone())
                // 기사 정보
                .driverId(match.getDriver().getId())
                .driverName(match.getDriver().getUser().getName())
                .driverPhone(match.getDriver().getUser().getPhone())
                // 요금
                .originalPrice(dispatch.getPrice())
                .finalPrice(match.getFinalPrice())
                // 작업 시간
                .matchedAt(match.getMatchedAt())
                .departedAt(match.getDepartedAt())
                .arrivedAt(match.getArrivedAt())
                .workStartedAt(match.getWorkStartedAt())
                .completedAt(match.getCompletedAt())
                // 서명 - 기사
                .driverSignature(match.getDriverSignature())
                .driverSignedAt(match.getDriverSignedAt())
                // 서명 - 현장 담당자
                .clientSignature(match.getClientSignature())
                .clientName(match.getClientName())
                .clientSignedAt(match.getClientSignedAt())
                // 서명 - 발주처
                .companySignature(match.getCompanySignature())
                .companySignedBy(match.getCompanySignedBy())
                .companySignedAt(match.getCompanySignedAt())
                .companyConfirmed(match.getCompanyConfirmed())
                // 작업 메모
                .workNotes(match.getWorkNotes())
                .workReportUrl(match.getWorkReportUrl())
                .workPhotos(match.getWorkPhotos())
                // 상태
                .status(match.getStatus().name())
                .dispatchStatus(dispatch.getStatus().name())
                .build();
    }
}
