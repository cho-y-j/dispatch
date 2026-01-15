package com.dispatch.dto.websocket;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LocationUpdate {

    private Long driverId;
    private String driverName;
    private Long dispatchId;
    private Double latitude;
    private Double longitude;
    private Double heading;        // 방향 (0-360도)
    private Double speed;          // 속도 (km/h)
    private LocalDateTime timestamp;

    public static LocationUpdate of(Long driverId, String driverName, Long dispatchId,
                                    Double latitude, Double longitude) {
        return LocationUpdate.builder()
                .driverId(driverId)
                .driverName(driverName)
                .dispatchId(dispatchId)
                .latitude(latitude)
                .longitude(longitude)
                .timestamp(LocalDateTime.now())
                .build();
    }
}
