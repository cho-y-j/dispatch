package com.dispatch.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "companies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 회사 정보
    @Column(nullable = false)
    private String name;

    @Column(name = "business_number", nullable = false, unique = true)
    private String businessNumber;

    @Column(name = "business_license_image")
    private String businessLicenseImage;

    @Column(name = "representative")
    private String representative;

    private String address;

    private String phone;

    // 담당자 정보
    @Column(name = "contact_name")
    private String contactName;

    @Column(name = "contact_email")
    private String contactEmail;

    @Column(name = "contact_phone")
    private String contactPhone;

    // 상태
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CompanyStatus status;

    // 검증 상태
    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status")
    private VerificationStatus verificationStatus;

    @Column(name = "verification_message")
    private String verificationMessage;

    // 경고 횟수
    @Column(name = "warning_count")
    @Builder.Default
    private Integer warningCount = 0;

    // 승인 정보
    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "approved_by")
    private Long approvedBy;

    // 회사 직원 목록
    @OneToMany(mappedBy = "company", cascade = CascadeType.ALL)
    @Builder.Default
    private List<User> employees = new ArrayList<>();

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public enum CompanyStatus {
        PENDING,        // 승인 대기
        APPROVED,       // 승인됨
        SUSPENDED,      // 정지됨
        BANNED          // 퇴장 (영구 정지)
    }

    public enum VerificationStatus {
        PENDING,        // 검증 대기
        VERIFYING,      // 검증 중
        VERIFIED,       // 검증 완료
        FAILED,         // 검증 실패
        REJECTED        // 관리자 거절
    }
}
