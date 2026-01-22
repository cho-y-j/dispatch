package com.dispatch.dto.company;

import com.dispatch.entity.Company;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyResponse {

    private Long id;
    private String name;
    private String businessNumber;
    private String businessLicenseImage;
    private String representative;
    private String address;
    private String phone;

    private String contactName;
    private String contactEmail;
    private String contactPhone;

    private Company.CompanyStatus status;
    private Company.VerificationStatus verificationStatus;
    private String verificationMessage;

    private Integer warningCount;
    private Integer employeeCount;

    private LocalDateTime createdAt;
    private LocalDateTime approvedAt;

    public static CompanyResponse from(Company company) {
        return CompanyResponse.builder()
                .id(company.getId())
                .name(company.getName())
                .businessNumber(company.getBusinessNumber())
                .businessLicenseImage(company.getBusinessLicenseImage())
                .representative(company.getRepresentative())
                .address(company.getAddress())
                .phone(company.getPhone())
                .contactName(company.getContactName())
                .contactEmail(company.getContactEmail())
                .contactPhone(company.getContactPhone())
                .status(company.getStatus())
                .verificationStatus(company.getVerificationStatus())
                .verificationMessage(company.getVerificationMessage())
                .warningCount(company.getWarningCount())
                .employeeCount(company.getEmployees() != null ? company.getEmployees().size() : 0)
                .createdAt(company.getCreatedAt())
                .approvedAt(company.getApprovedAt())
                .build();
    }
}
