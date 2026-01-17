package com.dispatch.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "warnings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Warning {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "user_type", nullable = false)
    private UserType userType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WarningType type;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Column(name = "dispatch_id")
    private Long dispatchId;

    @Column(name = "created_by", nullable = false)
    private Long createdBy;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    public enum UserType {
        DRIVER,
        COMPANY
    }

    public enum WarningType {
        CANCEL,     // 무단 취소
        LATE,       // 지각
        RUDE,       // 불친절
        SAFETY,     // 안전 문제
        NO_SHOW,    // 미출근
        OTHER       // 기타
    }
}
