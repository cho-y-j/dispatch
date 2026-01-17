package com.dispatch.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "driver_grade_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DriverGradeHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "driver_id", nullable = false)
    private Long driverId;

    @Enumerated(EnumType.STRING)
    @Column(name = "previous_grade")
    private DriverGrade previousGrade;

    @Enumerated(EnumType.STRING)
    @Column(name = "new_grade", nullable = false)
    private DriverGrade newGrade;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(name = "changed_by", nullable = false)
    private Long changedBy;

    @CreationTimestamp
    @Column(name = "changed_at", updatable = false)
    private LocalDateTime changedAt;

    public enum DriverGrade {
        GRADE_1,    // 1등급 - 최우선 배차
        GRADE_2,    // 2등급 - 시간차 후 노출
        GRADE_3     // 3등급 - 마지막 노출
    }
}
