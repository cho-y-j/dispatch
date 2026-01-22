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
public class CargoVerifyRequest {

    @NotBlank(message = "성명은 필수입니다")
    private String name;

    @NotBlank(message = "생년월일은 필수입니다")
    @Pattern(regexp = "\\d{4}-\\d{2}-\\d{2}", message = "생년월일 형식은 YYYY-MM-DD여야 합니다")
    private String birth;

    @NotBlank(message = "자격증번호는 필수입니다")
    private String lcnsNo;

    private String area;
}
