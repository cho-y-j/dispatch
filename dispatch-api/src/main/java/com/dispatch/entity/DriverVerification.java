package com.dispatch.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "driver_verifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DriverVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id", nullable = false)
    private Driver driver;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_type", nullable = false)
    private VerificationType verificationType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VerifyResult result;

    @Column(name = "reason_code")
    private String reasonCode;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(name = "raw_response", columnDefinition = "TEXT")
    private String rawResponse;

    @Column(name = "verified_by")
    private Long verifiedBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // 검증 유형
    public enum VerificationType {
        LICENSE,    // 운전면허
        BUSINESS,   // 사업자등록
        KOSHA,      // 안전보건 교육이수증
        CARGO       // 화물운송 자격증
    }

    // 검증 결과
    public enum VerifyResult {
        VALID,      // 검증 성공
        INVALID,    // 검증 실패
        UNKNOWN     // 확인 불가
    }
}
