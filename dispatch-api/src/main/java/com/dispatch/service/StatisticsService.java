package com.dispatch.service;

import com.dispatch.dto.statistics.CompanyStatistics;
import com.dispatch.dto.statistics.DashboardStatistics;
import com.dispatch.dto.statistics.DriverStatistics;
import com.dispatch.entity.*;
import com.dispatch.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class StatisticsService {

    private final DispatchRequestRepository dispatchRequestRepository;
    private final DispatchMatchRepository dispatchMatchRepository;
    private final DriverRepository driverRepository;
    private final CompanyRepository companyRepository;

    /**
     * 대시보드 통계
     */
    @Transactional(readOnly = true)
    public DashboardStatistics getDashboardStatistics() {
        List<DispatchRequest> allDispatches = dispatchRequestRepository.findAll();
        List<Driver> allDrivers = driverRepository.findAll();
        List<Company> allCompanies = companyRepository.findAll();

        LocalDate today = LocalDate.now();
        LocalDateTime todayStart = today.atStartOfDay();
        LocalDateTime todayEnd = today.plusDays(1).atStartOfDay();

        // 금일 배차
        List<DispatchRequest> todayDispatches = allDispatches.stream()
                .filter(d -> d.getCreatedAt().isAfter(todayStart) && d.getCreatedAt().isBefore(todayEnd))
                .toList();

        long todayCompleted = todayDispatches.stream()
                .filter(d -> d.getStatus() == DispatchRequest.DispatchStatus.COMPLETED)
                .count();

        long todayCancelled = todayDispatches.stream()
                .filter(d -> d.getStatus() == DispatchRequest.DispatchStatus.CANCELLED)
                .count();

        // 상태별 배차
        Map<String, Long> byStatus = allDispatches.stream()
                .collect(Collectors.groupingBy(
                        d -> d.getStatus().name(),
                        Collectors.counting()
                ));

        // 최근 7일 통계
        List<DashboardStatistics.DailyStats> dailyStats = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MM-dd");

        for (int i = 6; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            LocalDateTime dayStart = date.atStartOfDay();
            LocalDateTime dayEnd = date.plusDays(1).atStartOfDay();

            List<DispatchRequest> dayDispatches = allDispatches.stream()
                    .filter(d -> d.getCreatedAt().isAfter(dayStart) && d.getCreatedAt().isBefore(dayEnd))
                    .toList();

            dailyStats.add(DashboardStatistics.DailyStats.builder()
                    .date(date.format(formatter))
                    .dispatches((long) dayDispatches.size())
                    .completed(dayDispatches.stream()
                            .filter(d -> d.getStatus() == DispatchRequest.DispatchStatus.COMPLETED)
                            .count())
                    .cancelled(dayDispatches.stream()
                            .filter(d -> d.getStatus() == DispatchRequest.DispatchStatus.CANCELLED)
                            .count())
                    .build());
        }

        // 승인 대기
        long pendingDrivers = allDrivers.stream()
                .filter(d -> d.getVerificationStatus() == Driver.VerificationStatus.PENDING ||
                        d.getVerificationStatus() == Driver.VerificationStatus.VERIFYING)
                .count();

        long pendingCompanies = allCompanies.stream()
                .filter(c -> c.getStatus() == Company.CompanyStatus.PENDING)
                .count();

        // 완료율
        long totalCompleted = allDispatches.stream()
                .filter(d -> d.getStatus() == DispatchRequest.DispatchStatus.COMPLETED)
                .count();
        double completionRate = allDispatches.isEmpty() ? 0 :
                (double) totalCompleted / allDispatches.size() * 100;

        return DashboardStatistics.builder()
                .totalDispatches((long) allDispatches.size())
                .totalDrivers((long) allDrivers.size())
                .totalCompanies((long) allCompanies.size())
                .todayDispatches((long) todayDispatches.size())
                .todayCompleted(todayCompleted)
                .todayCancelled(todayCancelled)
                .dispatchesByStatus(byStatus)
                .dailyStats(dailyStats)
                .pendingDrivers(pendingDrivers)
                .pendingCompanies(pendingCompanies)
                .completionRate(Math.round(completionRate * 100.0) / 100.0)
                .build();
    }

    /**
     * 기사별 통계
     */
    @Transactional(readOnly = true)
    public List<DriverStatistics> getDriverStatistics() {
        return driverRepository.findAll().stream()
                .map(this::buildDriverStatistics)
                .toList();
    }

    /**
     * 특정 기사 통계
     */
    @Transactional(readOnly = true)
    public DriverStatistics getDriverStatistics(Long driverId) {
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new RuntimeException("기사를 찾을 수 없습니다"));
        return buildDriverStatistics(driver);
    }

    /**
     * 기사 본인 통계 (userId로 조회)
     */
    @Transactional(readOnly = true)
    public DriverStatistics getMyDriverStatistics(Long userId) {
        Driver driver = driverRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("기사 정보를 찾을 수 없습니다"));
        return buildDriverStatistics(driver);
    }

    /**
     * 발주처별 통계
     */
    @Transactional(readOnly = true)
    public List<CompanyStatistics> getCompanyStatistics() {
        return companyRepository.findAll().stream()
                .map(this::buildCompanyStatistics)
                .toList();
    }

    /**
     * 특정 발주처 통계
     */
    @Transactional(readOnly = true)
    public CompanyStatistics getCompanyStatistics(Long companyId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("발주처를 찾을 수 없습니다"));
        return buildCompanyStatistics(company);
    }

    /**
     * 내 발주처 통계 (userId로 조회)
     */
    @Transactional(readOnly = true)
    public CompanyStatistics getMyCompanyStatistics(Long userId) {
        Company company = companyRepository.findByEmployeesUserId(userId)
                .orElseThrow(() -> new RuntimeException("소속 회사를 찾을 수 없습니다"));
        return buildCompanyStatistics(company);
    }

    private DriverStatistics buildDriverStatistics(Driver driver) {
        List<DispatchMatch> matches = dispatchMatchRepository.findByDriverId(driver.getId());

        int completed = (int) matches.stream()
                .filter(m -> m.getStatus() == DispatchMatch.MatchStatus.COMPLETED ||
                        m.getStatus() == DispatchMatch.MatchStatus.SIGNED)
                .count();

        int cancelled = (int) matches.stream()
                .filter(m -> m.getStatus() == DispatchMatch.MatchStatus.CANCELLED)
                .count();

        return DriverStatistics.builder()
                .driverId(driver.getId())
                .driverName(driver.getUser().getName())
                .phone(driver.getUser().getPhone())
                .grade(driver.getGrade())
                .averageRating(driver.getAverageRating())
                .totalRatings(driver.getTotalRatings())
                .totalDispatches(matches.size())
                .completedDispatches(completed)
                .cancelledDispatches(cancelled)
                .warningCount(driver.getWarningCount())
                .isActive(driver.getIsActive())
                .verificationStatus(driver.getVerificationStatus())
                .build();
    }

    private CompanyStatistics buildCompanyStatistics(Company company) {
        List<DispatchRequest> dispatches = dispatchRequestRepository.findByCompanyId(company.getId());

        int completed = (int) dispatches.stream()
                .filter(d -> d.getStatus() == DispatchRequest.DispatchStatus.COMPLETED)
                .count();

        int cancelled = (int) dispatches.stream()
                .filter(d -> d.getStatus() == DispatchRequest.DispatchStatus.CANCELLED)
                .count();

        BigDecimal totalAmount = dispatches.stream()
                .filter(d -> d.getStatus() == DispatchRequest.DispatchStatus.COMPLETED && d.getPrice() != null)
                .map(DispatchRequest::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return CompanyStatistics.builder()
                .companyId(company.getId())
                .companyName(company.getName())
                .businessNumber(company.getBusinessNumber())
                .status(company.getStatus())
                .totalDispatches(dispatches.size())
                .completedDispatches(completed)
                .cancelledDispatches(cancelled)
                .totalAmount(totalAmount)
                .warningCount(company.getWarningCount())
                .employeeCount(company.getEmployees().size())
                .build();
    }
}
