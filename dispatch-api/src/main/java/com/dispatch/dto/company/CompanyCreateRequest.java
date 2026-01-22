package com.dispatch.dto.company;

import jakarta.validation.constraints.Email;
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
public class CompanyCreateRequest {

    @NotBlank(message = "회사명은 필수입니다")
    private String name;

    @NotBlank(message = "사업자번호는 필수입니다")
    @Pattern(regexp = "\\d{10}", message = "사업자번호는 10자리 숫자입니다")
    private String businessNumber;

    @NotBlank(message = "대표자명은 필수입니다")
    private String representative;

    private String address;

    private String phone;

    // 담당자 정보
    @NotBlank(message = "담당자 이름은 필수입니다")
    private String contactName;

    @NotBlank(message = "담당자 이메일은 필수입니다")
    @Email(message = "올바른 이메일 형식이 아닙니다")
    private String contactEmail;

    @NotBlank(message = "담당자 전화번호는 필수입니다")
    private String contactPhone;

    // 담당자 계정 비밀번호 (관리자가 생성 시)
    private String password;
}
