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
public class BizVerifyRequest {

    @NotBlank(message = "사업자번호는 필수입니다")
    @Pattern(regexp = "\\d{10}", message = "사업자번호는 10자리 숫자여야 합니다")
    private String businessNumber;

    // 개업일 (선택)
    @Pattern(regexp = "\\d{4}-\\d{2}-\\d{2}", message = "개업일 형식은 YYYY-MM-DD여야 합니다")
    private String startDate;

    // 대표자명 (선택)
    private String representativeName;
}
