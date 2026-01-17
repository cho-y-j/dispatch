package com.dispatch.controller;

import com.dispatch.dto.ApiResponse;
import com.dispatch.dto.admin.*;
import com.dispatch.dto.company.CompanyCreateRequest;
import com.dispatch.dto.company.CompanyResponse;
import com.dispatch.dto.company.CompanyUpdateRequest;
import com.dispatch.dto.driver.DriverResponse;
import com.dispatch.dto.settings.SystemSettingRequest;
import com.dispatch.dto.settings.SystemSettingResponse;
import com.dispatch.dto.statistics.CompanyStatistics;
import com.dispatch.dto.statistics.DashboardStatistics;
import com.dispatch.dto.statistics.DriverStatistics;
import com.dispatch.entity.Driver;
import com.dispatch.entity.Warning;
import com.dispatch.security.CustomUserDetails;
import com.dispatch.service.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "관리자", description = "관리자 전용 API")
public class AdminController {

    private final DriverService driverService;
    private final CompanyService companyService;
    private final WarningService warningService;
    private final SuspensionService suspensionService;
    private final StatisticsService statisticsService;
    private final SystemSettingService systemSettingService;

    // ==================== 기사 관리 ====================

    @GetMapping("/drivers")
    @Operation(summary = "전체 기사 목록", description = "모든 기사 목록을 조회합니다")
    public ResponseEntity<ApiResponse<List<DriverResponse>>> getAllDrivers() {
        List<DriverResponse> drivers = driverService.getAllDrivers();
        return ResponseEntity.ok(ApiResponse.success(drivers));
    }

    @GetMapping("/drivers/approved")
    @Operation(summary = "승인된 기사 목록", description = "승인된 기사 목록을 조회합니다")
    public ResponseEntity<ApiResponse<List<DriverResponse>>> getApprovedDrivers() {
        List<DriverResponse> drivers = driverService.getApprovedDrivers();
        return ResponseEntity.ok(ApiResponse.success(drivers));
    }

    @GetMapping("/drivers/pending")
    @Operation(summary = "승인 대기 기사 목록", description = "승인 대기 중인 기사 목록을 조회합니다")
    public ResponseEntity<ApiResponse<List<DriverResponse>>> getPendingDrivers() {
        List<DriverResponse> drivers = driverService.getPendingDrivers();
        return ResponseEntity.ok(ApiResponse.success(drivers));
    }

    @PostMapping("/drivers/{driverId}/approve")
    @Operation(summary = "기사 승인", description = "기사 등록을 승인합니다")
    public ResponseEntity<ApiResponse<DriverResponse>> approveDriver(
            @PathVariable Long driverId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        DriverResponse response = driverService.approveDriver(driverId, userDetails.getUserId());
        return ResponseEntity.ok(ApiResponse.success("기사가 승인되었습니다", response));
    }

    @PostMapping("/drivers/{driverId}/reject")
    @Operation(summary = "기사 거절", description = "기사 등록을 거절합니다")
    public ResponseEntity<ApiResponse<DriverResponse>> rejectDriver(
            @PathVariable Long driverId,
            @RequestParam(required = false, defaultValue = "서류 검증에 실패했습니다") String reason) {

        DriverResponse response = driverService.rejectDriver(driverId, reason);
        return ResponseEntity.ok(ApiResponse.success("기사가 거절되었습니다", response));
    }

    @PutMapping("/drivers/{driverId}/grade")
    @Operation(summary = "기사 등급 변경", description = "기사의 등급을 변경합니다")
    public ResponseEntity<ApiResponse<DriverResponse>> updateDriverGrade(
            @PathVariable Long driverId,
            @Valid @RequestBody GradeUpdateRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        DriverResponse response = driverService.updateDriverGrade(driverId, request, userDetails.getUserId());
        return ResponseEntity.ok(ApiResponse.success("등급이 변경되었습니다", response));
    }

    // ==================== 발주처 관리 ====================

    @GetMapping("/companies")
    @Operation(summary = "발주처 목록", description = "모든 발주처 목록을 조회합니다")
    public ResponseEntity<ApiResponse<List<CompanyResponse>>> getAllCompanies() {
        List<CompanyResponse> companies = companyService.getAllCompanies();
        return ResponseEntity.ok(ApiResponse.success(companies));
    }

    @GetMapping("/companies/pending")
    @Operation(summary = "승인 대기 발주처 목록", description = "승인 대기 중인 발주처 목록을 조회합니다")
    public ResponseEntity<ApiResponse<List<CompanyResponse>>> getPendingCompanies() {
        List<CompanyResponse> companies = companyService.getPendingCompanies();
        return ResponseEntity.ok(ApiResponse.success(companies));
    }

    @PostMapping("/companies")
    @Operation(summary = "발주처 생성", description = "관리자가 직접 발주처를 생성합니다")
    public ResponseEntity<ApiResponse<CompanyResponse>> createCompany(
            @Valid @RequestBody CompanyCreateRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        CompanyResponse response = companyService.createByAdmin(request, userDetails.getUserId());
        return ResponseEntity.ok(ApiResponse.success("발주처가 생성되었습니다", response));
    }

    @GetMapping("/companies/{companyId}")
    @Operation(summary = "발주처 상세 조회", description = "발주처 상세 정보를 조회합니다")
    public ResponseEntity<ApiResponse<CompanyResponse>> getCompany(@PathVariable Long companyId) {
        CompanyResponse response = companyService.getCompany(companyId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/companies/{companyId}")
    @Operation(summary = "발주처 정보 수정", description = "발주처 정보를 수정합니다")
    public ResponseEntity<ApiResponse<CompanyResponse>> updateCompany(
            @PathVariable Long companyId,
            @Valid @RequestBody CompanyUpdateRequest request) {

        CompanyResponse response = companyService.updateCompany(companyId, request);
        return ResponseEntity.ok(ApiResponse.success("발주처 정보가 수정되었습니다", response));
    }

    @PostMapping("/companies/{companyId}/approve")
    @Operation(summary = "발주처 승인", description = "발주처를 승인합니다")
    public ResponseEntity<ApiResponse<CompanyResponse>> approveCompany(
            @PathVariable Long companyId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        CompanyResponse response = companyService.approveCompany(companyId, userDetails.getUserId());
        return ResponseEntity.ok(ApiResponse.success("발주처가 승인되었습니다", response));
    }

    @PostMapping("/companies/{companyId}/reject")
    @Operation(summary = "발주처 거절", description = "발주처를 거절합니다")
    public ResponseEntity<ApiResponse<CompanyResponse>> rejectCompany(
            @PathVariable Long companyId,
            @RequestParam(required = false, defaultValue = "서류 검증에 실패했습니다") String reason) {

        CompanyResponse response = companyService.rejectCompany(companyId, reason);
        return ResponseEntity.ok(ApiResponse.success("발주처가 거절되었습니다", response));
    }

    @DeleteMapping("/companies/{companyId}")
    @Operation(summary = "발주처 삭제 (퇴장)", description = "발주처를 퇴장 처리합니다")
    public ResponseEntity<ApiResponse<Void>> deleteCompany(@PathVariable Long companyId) {
        companyService.deleteCompany(companyId);
        return ResponseEntity.ok(ApiResponse.success("발주처가 퇴장 처리되었습니다", null));
    }

    @GetMapping("/companies/search")
    @Operation(summary = "발주처 검색", description = "키워드로 발주처를 검색합니다")
    public ResponseEntity<ApiResponse<List<CompanyResponse>>> searchCompanies(
            @RequestParam String keyword) {
        List<CompanyResponse> companies = companyService.searchCompanies(keyword);
        return ResponseEntity.ok(ApiResponse.success(companies));
    }

    // ==================== 경고 관리 ====================

    @GetMapping("/warnings")
    @Operation(summary = "경고 목록", description = "모든 경고 목록을 조회합니다")
    public ResponseEntity<ApiResponse<List<WarningResponse>>> getAllWarnings() {
        List<WarningResponse> warnings = warningService.getAllWarnings();
        return ResponseEntity.ok(ApiResponse.success(warnings));
    }

    @PostMapping("/warnings")
    @Operation(summary = "경고 부여", description = "사용자에게 경고를 부여합니다")
    public ResponseEntity<ApiResponse<WarningResponse>> createWarning(
            @Valid @RequestBody WarningRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        WarningResponse response = warningService.createWarning(request, userDetails.getUserId());
        return ResponseEntity.ok(ApiResponse.success("경고가 부여되었습니다", response));
    }

    @GetMapping("/warnings/user/{userId}")
    @Operation(summary = "사용자 경고 조회", description = "특정 사용자의 경고 목록을 조회합니다")
    public ResponseEntity<ApiResponse<List<WarningResponse>>> getWarningsByUser(
            @PathVariable Long userId,
            @RequestParam Warning.UserType userType) {

        List<WarningResponse> warnings = warningService.getWarningsByUser(userId, userType);
        return ResponseEntity.ok(ApiResponse.success(warnings));
    }

    // ==================== 정지 관리 ====================

    @GetMapping("/suspensions")
    @Operation(summary = "정지 목록", description = "모든 정지 목록을 조회합니다")
    public ResponseEntity<ApiResponse<List<SuspensionResponse>>> getAllSuspensions() {
        List<SuspensionResponse> suspensions = suspensionService.getAllSuspensions();
        return ResponseEntity.ok(ApiResponse.success(suspensions));
    }

    @GetMapping("/suspensions/active")
    @Operation(summary = "활성 정지 목록", description = "현재 활성화된 정지 목록을 조회합니다")
    public ResponseEntity<ApiResponse<List<SuspensionResponse>>> getActiveSuspensions() {
        List<SuspensionResponse> suspensions = suspensionService.getActiveSuspensions();
        return ResponseEntity.ok(ApiResponse.success(suspensions));
    }

    @PostMapping("/suspensions")
    @Operation(summary = "정지 처리", description = "사용자를 정지 처리합니다")
    public ResponseEntity<ApiResponse<SuspensionResponse>> createSuspension(
            @Valid @RequestBody SuspensionRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        SuspensionResponse response = suspensionService.createSuspension(request, userDetails.getUserId());
        return ResponseEntity.ok(ApiResponse.success("정지 처리되었습니다", response));
    }

    @DeleteMapping("/suspensions/{suspensionId}")
    @Operation(summary = "정지 해제", description = "정지를 해제합니다")
    public ResponseEntity<ApiResponse<SuspensionResponse>> liftSuspension(
            @PathVariable Long suspensionId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        SuspensionResponse response = suspensionService.liftSuspension(suspensionId, userDetails.getUserId());
        return ResponseEntity.ok(ApiResponse.success("정지가 해제되었습니다", response));
    }

    // ==================== 통계 ====================

    @GetMapping("/statistics/dashboard")
    @Operation(summary = "대시보드 통계", description = "관리자 대시보드 통계를 조회합니다")
    public ResponseEntity<ApiResponse<DashboardStatistics>> getDashboardStatistics() {
        DashboardStatistics statistics = statisticsService.getDashboardStatistics();
        return ResponseEntity.ok(ApiResponse.success(statistics));
    }

    @GetMapping("/statistics/drivers")
    @Operation(summary = "기사별 통계", description = "모든 기사의 통계를 조회합니다")
    public ResponseEntity<ApiResponse<List<DriverStatistics>>> getDriverStatistics() {
        List<DriverStatistics> statistics = statisticsService.getDriverStatistics();
        return ResponseEntity.ok(ApiResponse.success(statistics));
    }

    @GetMapping("/statistics/drivers/{driverId}")
    @Operation(summary = "기사 상세 통계", description = "특정 기사의 통계를 조회합니다")
    public ResponseEntity<ApiResponse<DriverStatistics>> getDriverStatistics(@PathVariable Long driverId) {
        DriverStatistics statistics = statisticsService.getDriverStatistics(driverId);
        return ResponseEntity.ok(ApiResponse.success(statistics));
    }

    @GetMapping("/statistics/companies")
    @Operation(summary = "발주처별 통계", description = "모든 발주처의 통계를 조회합니다")
    public ResponseEntity<ApiResponse<List<CompanyStatistics>>> getCompanyStatistics() {
        List<CompanyStatistics> statistics = statisticsService.getCompanyStatistics();
        return ResponseEntity.ok(ApiResponse.success(statistics));
    }

    @GetMapping("/statistics/companies/{companyId}")
    @Operation(summary = "발주처 상세 통계", description = "특정 발주처의 통계를 조회합니다")
    public ResponseEntity<ApiResponse<CompanyStatistics>> getCompanyStatistics(@PathVariable Long companyId) {
        CompanyStatistics statistics = statisticsService.getCompanyStatistics(companyId);
        return ResponseEntity.ok(ApiResponse.success(statistics));
    }

    // ==================== 설정 관리 ====================

    @GetMapping("/settings")
    @Operation(summary = "설정 목록", description = "모든 시스템 설정을 조회합니다")
    public ResponseEntity<ApiResponse<List<SystemSettingResponse>>> getAllSettings() {
        List<SystemSettingResponse> settings = systemSettingService.getAllSettings();
        return ResponseEntity.ok(ApiResponse.success(settings));
    }

    @GetMapping("/settings/{key}")
    @Operation(summary = "설정 조회", description = "특정 시스템 설정을 조회합니다")
    public ResponseEntity<ApiResponse<SystemSettingResponse>> getSetting(@PathVariable String key) {
        SystemSettingResponse setting = systemSettingService.getSetting(key);
        return ResponseEntity.ok(ApiResponse.success(setting));
    }

    @PutMapping("/settings/{key}")
    @Operation(summary = "설정 수정", description = "시스템 설정을 수정합니다")
    public ResponseEntity<ApiResponse<SystemSettingResponse>> updateSetting(
            @PathVariable String key,
            @Valid @RequestBody SystemSettingRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        SystemSettingResponse response = systemSettingService.updateSetting(key, request, userDetails.getUserId());
        return ResponseEntity.ok(ApiResponse.success("설정이 수정되었습니다", response));
    }

    @GetMapping("/grade-settings")
    @Operation(summary = "등급 설정 조회", description = "등급별 배차 지연 설정을 조회합니다")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> getGradeSettings() {
        Map<String, Integer> settings = systemSettingService.getGradeDelaySettings();
        return ResponseEntity.ok(ApiResponse.success(settings));
    }
}
