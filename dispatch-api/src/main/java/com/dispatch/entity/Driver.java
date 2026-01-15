package com.dispatch.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "drivers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Driver {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    // 사업자 정보
    @Column(name = "business_registration_number")
    private String businessRegistrationNumber;

    @Column(name = "business_registration_image")
    private String businessRegistrationImage;

    @Column(name = "business_name")
    private String businessName;

    // 운전면허 정보
    @Column(name = "driver_license_number")
    private String driverLicenseNumber;

    @Column(name = "driver_license_image")
    private String driverLicenseImage;

    // 검증 상태
    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status")
    private VerificationStatus verificationStatus;

    @Column(name = "verification_message")
    private String verificationMessage;

    // 현재 위치 (실시간 업데이트)
    private Double latitude;
    private Double longitude;

    @Column(name = "location_updated_at")
    private LocalDateTime locationUpdatedAt;

    // 활동 상태
    @Column(name = "is_active")
    private Boolean isActive;

    // 승인 정보
    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "approved_by")
    private Long approvedBy;

    // 장비 목록
    @OneToMany(mappedBy = "driver", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Equipment> equipments = new ArrayList<>();

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public enum VerificationStatus {
        PENDING,        // 검증 대기
        VERIFYING,      // 검증 중
        VERIFIED,       // 검증 완료
        FAILED,         // 검증 실패
        REJECTED        // 관리자 거절
    }
}
