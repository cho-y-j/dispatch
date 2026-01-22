package com.dispatch.dto.driver;

import com.dispatch.entity.Equipment;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriverRegisterRequest {

    @NotBlank(message = "사업자등록번호는 필수입니다")
    private String businessRegistrationNumber;

    @NotBlank(message = "상호명은 필수입니다")
    private String businessName;

    @NotBlank(message = "운전면허번호는 필수입니다")
    private String driverLicenseNumber;

    // 장비 정보
    @NotNull(message = "장비 종류는 필수입니다")
    private Equipment.EquipmentType equipmentType;

    @NotBlank(message = "장비 모델명은 필수입니다")
    private String equipmentModel;

    private String tonnage;

    private Double maxHeight;

    private String vehicleNumber;
}
