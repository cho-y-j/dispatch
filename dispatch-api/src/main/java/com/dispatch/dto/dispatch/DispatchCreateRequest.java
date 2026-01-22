package com.dispatch.dto.dispatch;

import com.dispatch.entity.Equipment;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class DispatchCreateRequest {

    @NotBlank(message = "현장 주소는 필수입니다")
    private String siteAddress;

    private String siteDetail;

    // 좌표는 주소 검색을 통해 자동 설정됨 (선택적)
    private Double latitude;

    private Double longitude;

    private String contactName;
    private String contactPhone;

    @NotNull(message = "작업 날짜는 필수입니다")
    @Future(message = "작업 날짜는 오늘 이후여야 합니다")
    private LocalDate workDate;

    @NotNull(message = "작업 시간은 필수입니다")
    private LocalTime workTime;

    private Integer estimatedHours;

    private String workDescription;

    @NotNull(message = "장비 종류는 필수입니다")
    private Equipment.EquipmentType equipmentType;

    private Double minHeight;

    private String equipmentRequirements;

    private BigDecimal price;

    private Boolean priceNegotiable;
}
