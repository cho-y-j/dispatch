package com.dispatch.dto.driver;

import com.dispatch.entity.Driver;
import com.dispatch.entity.Equipment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriverResponse {

    private Long id;
    private Long userId;
    private String name;
    private String email;
    private String phone;

    private String businessRegistrationNumber;
    private String businessName;
    private String businessRegistrationImage;

    private String driverLicenseNumber;
    private String driverLicenseImage;

    private Driver.VerificationStatus verificationStatus;
    private String verificationMessage;

    private Double latitude;
    private Double longitude;
    private Boolean isActive;

    private List<EquipmentInfo> equipments;

    private LocalDateTime createdAt;
    private LocalDateTime approvedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EquipmentInfo {
        private Long id;
        private Equipment.EquipmentType type;
        private String typeName;
        private String model;
        private String tonnage;
        private Double maxHeight;
        private String vehicleNumber;
        private Equipment.EquipmentStatus status;
    }

    public static DriverResponse from(Driver driver) {
        List<EquipmentInfo> equipmentInfos = driver.getEquipments().stream()
                .map(e -> EquipmentInfo.builder()
                        .id(e.getId())
                        .type(e.getType())
                        .typeName(e.getType().getDisplayName())
                        .model(e.getModel())
                        .tonnage(e.getTonnage())
                        .maxHeight(e.getMaxHeight())
                        .vehicleNumber(e.getVehicleNumber())
                        .status(e.getStatus())
                        .build())
                .toList();

        return DriverResponse.builder()
                .id(driver.getId())
                .userId(driver.getUser().getId())
                .name(driver.getUser().getName())
                .email(driver.getUser().getEmail())
                .phone(driver.getUser().getPhone())
                .businessRegistrationNumber(driver.getBusinessRegistrationNumber())
                .businessName(driver.getBusinessName())
                .businessRegistrationImage(driver.getBusinessRegistrationImage())
                .driverLicenseNumber(driver.getDriverLicenseNumber())
                .driverLicenseImage(driver.getDriverLicenseImage())
                .verificationStatus(driver.getVerificationStatus())
                .verificationMessage(driver.getVerificationMessage())
                .latitude(driver.getLatitude())
                .longitude(driver.getLongitude())
                .isActive(driver.getIsActive())
                .equipments(equipmentInfos)
                .createdAt(driver.getCreatedAt())
                .approvedAt(driver.getApprovedAt())
                .build();
    }
}
