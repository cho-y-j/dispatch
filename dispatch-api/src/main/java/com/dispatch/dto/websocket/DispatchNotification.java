package com.dispatch.dto.websocket;

import com.dispatch.entity.DispatchRequest;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DispatchNotification {

    private Long dispatchId;
    private String siteAddress;
    private String siteDetail;
    private Double latitude;
    private Double longitude;
    private LocalDate workDate;
    private LocalTime workTime;
    private Integer estimatedHours;
    private String equipmentType;
    private BigDecimal price;
    private Boolean priceNegotiable;
    private String status;

    // 배차 수락 시 기사 정보
    private Long driverId;
    private String driverName;
    private String driverPhone;
    private String vehicleNumber;

    public static DispatchNotification from(DispatchRequest dispatch) {
        return DispatchNotification.builder()
                .dispatchId(dispatch.getId())
                .siteAddress(dispatch.getSiteAddress())
                .siteDetail(dispatch.getSiteDetail())
                .latitude(dispatch.getLatitude())
                .longitude(dispatch.getLongitude())
                .workDate(dispatch.getWorkDate())
                .workTime(dispatch.getWorkTime())
                .estimatedHours(dispatch.getEstimatedHours())
                .equipmentType(dispatch.getEquipmentType().name())
                .price(dispatch.getPrice())
                .priceNegotiable(dispatch.getPriceNegotiable())
                .status(dispatch.getStatus().name())
                .build();
    }

    public static DispatchNotification from(DispatchRequest dispatch, com.dispatch.entity.DispatchMatch match) {
        DispatchNotificationBuilder builder = DispatchNotification.builder()
                .dispatchId(dispatch.getId())
                .siteAddress(dispatch.getSiteAddress())
                .siteDetail(dispatch.getSiteDetail())
                .latitude(dispatch.getLatitude())
                .longitude(dispatch.getLongitude())
                .workDate(dispatch.getWorkDate())
                .workTime(dispatch.getWorkTime())
                .estimatedHours(dispatch.getEstimatedHours())
                .equipmentType(dispatch.getEquipmentType().name())
                .price(dispatch.getPrice())
                .priceNegotiable(dispatch.getPriceNegotiable())
                .status(dispatch.getStatus().name());

        // 매칭된 기사 정보가 있으면 추가
        if (match != null && match.getDriver() != null) {
            var driver = match.getDriver();
            builder.driverId(driver.getId())
                   .driverName(driver.getUser().getName())
                   .driverPhone(driver.getUser().getPhone());

            if (driver.getEquipments() != null && !driver.getEquipments().isEmpty()) {
                builder.vehicleNumber(driver.getEquipments().get(0).getVehicleNumber());
            }
        }

        return builder.build();
    }
}
