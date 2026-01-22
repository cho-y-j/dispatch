package com.dispatch.dto.company;

import jakarta.validation.constraints.Email;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyUpdateRequest {

    private String name;
    private String representative;
    private String address;
    private String phone;

    private String contactName;

    @Email(message = "올바른 이메일 형식이 아닙니다")
    private String contactEmail;

    private String contactPhone;
}
