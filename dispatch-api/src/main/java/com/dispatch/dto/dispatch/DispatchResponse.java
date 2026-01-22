package com.dispatch.dto.dispatch;

import com.dispatch.entity.DispatchMatch;
import com.dispatch.entity.DispatchRequest;
import com.dispatch.entity.Equipment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DispatchResponse {

    private Long id;

    // 요청자 정보
    private StaffInfo staff;

    // 현장 정보
    private String siteAddress;
    private String siteDetail;
    private Double latitude;
    private Double longitude;
    private String contactName;
    private String contactPhone;

    // 작업 정보
    private LocalDate workDate;
    private LocalTime workTime;
    private Integer estimatedHours;
    private String workDescription;

    // 장비 요구사항
    private Equipment.EquipmentType equipmentType;
    private String equipmentTypeName;
    private Double minHeight;
    private String equipmentRequirements;

    // 요금
    private BigDecimal price;
    private Boolean priceNegotiable;

    // 상태
    private DispatchRequest.DispatchStatus status;

    // 매칭 정보
    private MatchInfo match;

    private LocalDateTime createdAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StaffInfo {
        private Long id;
        private String name;
        private String phone;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MatchInfo {
        private Long id;
        private Long driverId;
        private String driverName;
        private String driverPhone;
        private DispatchMatch.MatchStatus status;
        private LocalDateTime matchedAt;
        private LocalDateTime arrivedAt;
        private LocalDateTime completedAt;
        private BigDecimal finalPrice;
        private String workReportUrl;
    }

    public static DispatchResponse from(DispatchRequest request) {
        return from(request, null);
    }

    public static DispatchResponse from(DispatchRequest request, DispatchMatch match) {
        DispatchResponseBuilder builder = DispatchResponse.builder()
                .id(request.getId())
                .staff(StaffInfo.builder()
                        .id(request.getStaff().getId())
                        .name(request.getStaff().getName())
                        .phone(request.getStaff().getPhone())
                        .build())
                .siteAddress(request.getSiteAddress())
                .siteDetail(request.getSiteDetail())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .contactName(request.getContactName())
                .contactPhone(request.getContactPhone())
                .workDate(request.getWorkDate())
                .workTime(request.getWorkTime())
                .estimatedHours(request.getEstimatedHours())
                .workDescription(request.getWorkDescription())
                .equipmentType(request.getEquipmentType())
                .equipmentTypeName(request.getEquipmentType().getDisplayName())
                .minHeight(request.getMinHeight())
                .equipmentRequirements(request.getEquipmentRequirements())
                .price(request.getPrice())
                .priceNegotiable(request.getPriceNegotiable())
                .status(request.getStatus())
                .createdAt(request.getCreatedAt());

        if (match != null) {
            builder.match(MatchInfo.builder()
                    .id(match.getId())
                    .driverId(match.getDriver().getId())
                    .driverName(match.getDriver().getUser().getName())
                    .driverPhone(match.getDriver().getUser().getPhone())
                    .status(match.getStatus())
                    .matchedAt(match.getMatchedAt())
                    .arrivedAt(match.getArrivedAt())
                    .completedAt(match.getCompletedAt())
                    .finalPrice(match.getFinalPrice())
                    .workReportUrl(match.getWorkReportUrl())
                    .build());
        }

        return builder.build();
    }
}
