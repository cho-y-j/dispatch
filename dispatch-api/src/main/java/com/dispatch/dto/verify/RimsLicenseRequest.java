package com.dispatch.dto.verify;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RimsLicenseRequest {

    @NotBlank(message = "면허번호는 필수입니다")
    private String licenseNumber;

    @NotBlank(message = "성명은 필수입니다")
    private String name;

    @Pattern(regexp = "\\d{4}-\\d{2}-\\d{2}", message = "생년월일 형식은 YYYY-MM-DD여야 합니다")
    private String birth;

    // 면허종별 (1종대형, 1종보통, 2종보통 등)
    private String licenseType;
}
