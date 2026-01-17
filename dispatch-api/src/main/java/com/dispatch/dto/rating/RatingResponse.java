package com.dispatch.dto.rating;

import com.dispatch.entity.DriverRating;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RatingResponse {

    private Long id;
    private Long dispatchId;
    private Long driverId;
    private String driverName;
    private Long companyId;
    private String companyName;
    private Long raterUserId;
    private String raterName;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;

    public static RatingResponse from(DriverRating rating) {
        return RatingResponse.builder()
                .id(rating.getId())
                .dispatchId(rating.getDispatchId())
                .driverId(rating.getDriverId())
                .companyId(rating.getCompanyId())
                .raterUserId(rating.getRaterUserId())
                .rating(rating.getRating())
                .comment(rating.getComment())
                .createdAt(rating.getCreatedAt())
                .build();
    }
}
