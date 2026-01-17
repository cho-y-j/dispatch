package com.dispatch.dto.statistics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatistics {

    // 총계
    private Long totalDispatches;
    private Long totalDrivers;
    private Long totalCompanies;

    // 금일 현황
    private Long todayDispatches;
    private Long todayCompleted;
    private Long todayCancelled;

    // 상태별 배차
    private Map<String, Long> dispatchesByStatus;

    // 기간별 배차 (최근 7일/30일)
    private List<DailyStats> dailyStats;

    // 기사 승인 대기
    private Long pendingDrivers;

    // 업체 승인 대기
    private Long pendingCompanies;

    // 완료율
    private Double completionRate;

    // 평균 매칭 시간 (분)
    private Double averageMatchingTimeMinutes;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyStats {
        private String date;
        private Long dispatches;
        private Long completed;
        private Long cancelled;
    }
}
