package com.dispatch.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "dispatch_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DispatchRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 배차 요청자 (직원)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id", nullable = false)
    private User staff;

    // 발주처 (업체)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company;

    // 현장 정보
    @Column(name = "site_address", nullable = false)
    private String siteAddress;

    @Column(name = "site_detail")
    private String siteDetail;

    // 좌표 (선택적 - 주소 검색으로 자동 설정)
    private Double latitude;

    private Double longitude;

    // 담당자 정보
    @Column(name = "contact_name")
    private String contactName;

    @Column(name = "contact_phone")
    private String contactPhone;

    // 작업 정보
    @Column(name = "work_date", nullable = false)
    private LocalDate workDate;

    @Column(name = "work_time", nullable = false)
    private LocalTime workTime;

    @Column(name = "estimated_hours")
    private Integer estimatedHours;

    @Column(name = "work_description", columnDefinition = "TEXT")
    private String workDescription;

    // 장비 요구사항
    @Enumerated(EnumType.STRING)
    @Column(name = "equipment_type", nullable = false)
    private Equipment.EquipmentType equipmentType;

    @Column(name = "min_height")
    private Double minHeight;

    @Column(name = "equipment_requirements")
    private String equipmentRequirements;

    // 요금
    @Column(precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "price_negotiable")
    private Boolean priceNegotiable;

    // 상태
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DispatchStatus status;

    // 긴급 배차 옵션
    @Column(name = "is_urgent")
    @Builder.Default
    private Boolean isUrgent = false;

    // 최소 기사 별점 필터
    @Column(name = "min_driver_rating")
    private Integer minDriverRating;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public enum DispatchStatus {
        OPEN,           // 배차 대기
        MATCHED,        // 매칭 완료
        IN_PROGRESS,    // 작업 중
        COMPLETED,      // 완료
        CANCELLED       // 취소
    }
}
