package com.dispatch.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "dispatch_matches")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DispatchMatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false)
    private DispatchRequest request;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id", nullable = false)
    private Driver driver;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipment_id")
    private Equipment equipment;

    // 시간 기록
    @Column(name = "matched_at")
    private LocalDateTime matchedAt;

    @Column(name = "departed_at")
    private LocalDateTime departedAt;

    @Column(name = "arrived_at")
    private LocalDateTime arrivedAt;

    @Column(name = "work_started_at")
    private LocalDateTime workStartedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    // 최종 요금
    @Column(name = "final_price", precision = 10, scale = 2)
    private BigDecimal finalPrice;

    // 전자서명 - 기사
    @Column(name = "driver_signature", columnDefinition = "TEXT")
    private String driverSignature;

    @Column(name = "driver_signed_at")
    private LocalDateTime driverSignedAt;

    // 전자서명 - 현장 담당자 (고객)
    @Column(name = "client_signature", columnDefinition = "TEXT")
    private String clientSignature;

    @Column(name = "client_name")
    private String clientName;

    @Column(name = "client_signed_at")
    private LocalDateTime clientSignedAt;

    // 전자서명 - 발주처 확인
    @Column(name = "company_signature", columnDefinition = "TEXT")
    private String companySignature;

    @Column(name = "company_signed_by")
    private String companySignedBy;

    @Column(name = "company_signed_at")
    private LocalDateTime companySignedAt;

    @Column(name = "company_confirmed")
    private Boolean companyConfirmed;

    // 작업 확인서
    @Column(name = "work_report_url")
    private String workReportUrl;

    // 작업 사진
    @Column(name = "work_photos", columnDefinition = "TEXT")
    private String workPhotos; // JSON array of photo URLs

    // 작업 메모
    @Column(name = "work_notes", columnDefinition = "TEXT")
    private String workNotes;

    // 상태
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MatchStatus status;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public enum MatchStatus {
        ACCEPTED,       // 수락됨
        EN_ROUTE,       // 이동 중
        ARRIVED,        // 현장 도착
        WORKING,        // 작업 중
        COMPLETED,      // 작업 완료
        SIGNED,         // 서명 완료
        CANCELLED       // 취소
    }
}
