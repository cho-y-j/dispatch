package com.dispatch.dto.statistics;

import com.dispatch.entity.Company;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyStatistics {

    private Long companyId;
    private String companyName;
    private String businessNumber;

    private Company.CompanyStatus status;

    private Integer totalDispatches;
    private Integer completedDispatches;
    private Integer cancelledDispatches;

    private BigDecimal totalAmount;

    private Integer warningCount;
    private Integer employeeCount;
}
