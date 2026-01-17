package com.dispatch.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "suspensions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Suspension {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "user_type", nullable = false)
    private Warning.UserType userType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SuspensionType type;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Column(name = "start_date", nullable = false)
    private LocalDateTime startDate;

    @Column(name = "end_date")
    private LocalDateTime endDate;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_by", nullable = false)
    private Long createdBy;

    @Column(name = "lifted_by")
    private Long liftedBy;

    @Column(name = "lifted_at")
    private LocalDateTime liftedAt;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    public enum SuspensionType {
        TEMP,       // 일시 정지
        PERMANENT   // 영구 정지 (퇴장)
    }
}
