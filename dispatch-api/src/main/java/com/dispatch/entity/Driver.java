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

    // 등급 시스템
    @Enumerated(EnumType.STRING)
    @Column(name = "grade")
    @Builder.Default
    private DriverGrade grade = DriverGrade.GRADE_3;

    @Column(name = "average_rating")
    @Builder.Default
    private Double averageRating = 0.0;

    @Column(name = "total_ratings")
    @Builder.Default
    private Integer totalRatings = 0;

    @Column(name = "total_completed_dispatches")
    @Builder.Default
    private Integer totalCompletedDispatches = 0;

    @Column(name = "warning_count")
    @Builder.Default
    private Integer warningCount = 0;

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

    public enum DriverGrade {
        GRADE_1,    // 1등급 - 최우선 배차
        GRADE_2,    // 2등급 - 시간차 후 노출
        GRADE_3     // 3등급 - 마지막 노출
    }
}
