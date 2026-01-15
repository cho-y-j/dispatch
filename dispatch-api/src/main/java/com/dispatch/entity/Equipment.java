package com.dispatch.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "equipments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Equipment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id", nullable = false)
    private Driver driver;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EquipmentType type;

    @Column(nullable = false)
    private String model;

    // 톤수/사양
    private String tonnage;

    // 최대 작업 높이 (미터)
    @Column(name = "max_height")
    private Double maxHeight;

    // 차량 번호
    @Column(name = "vehicle_number")
    private String vehicleNumber;

    // 장비 사진 (JSON 배열로 저장)
    @Column(columnDefinition = "TEXT")
    private String images;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EquipmentStatus status;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public enum EquipmentType {
        HIGH_LIFT_TRUCK("고소작업차"),
        AERIAL_PLATFORM("고소작업대"),
        SCISSOR_LIFT("시저리프트"),
        BOOM_LIFT("붐리프트"),
        LADDER_TRUCK("사다리차"),
        CRANE("크레인"),
        FORKLIFT("지게차"),
        OTHER("기타");

        private final String displayName;

        EquipmentType(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    public enum EquipmentStatus {
        ACTIVE,     // 활성
        INACTIVE,   // 비활성
        MAINTENANCE // 정비 중
    }
}
