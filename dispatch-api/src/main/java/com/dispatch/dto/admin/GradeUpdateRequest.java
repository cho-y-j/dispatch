package com.dispatch.dto.admin;

import com.dispatch.entity.Driver;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GradeUpdateRequest {

    @NotNull(message = "등급은 필수입니다")
    private Driver.DriverGrade grade;

    private String reason;
}
