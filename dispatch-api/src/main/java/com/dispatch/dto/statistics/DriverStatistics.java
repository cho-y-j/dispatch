package com.dispatch.dto.statistics;

import com.dispatch.entity.Driver;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriverStatistics {

    private Long driverId;
    private String driverName;
    private String phone;

    private Driver.DriverGrade grade;
    private Double averageRating;
    private Integer totalRatings;

    private Integer totalDispatches;
    private Integer completedDispatches;
    private Integer cancelledDispatches;

    private Integer warningCount;

    private Boolean isActive;
    private Driver.VerificationStatus verificationStatus;
}
