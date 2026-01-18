package com.dispatch.controller;

import com.dispatch.dto.ApiResponse;
import com.dispatch.dto.dispatch.DispatchCreateRequest;
import com.dispatch.dto.dispatch.DispatchResponse;
import com.dispatch.dto.dispatch.SignatureRequest;
import com.dispatch.dto.dispatch.WorkReportResponse;
import com.dispatch.security.CustomUserDetails;
import com.dispatch.service.DispatchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dispatches")
@RequiredArgsConstructor
@Tag(name = "배차", description = "배차 등록 및 관리 API")
public class DispatchController {

    private final DispatchService dispatchService;

    // ========== 직원용 API ==========

    @PostMapping
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN', 'COMPANY')")
    @Operation(summary = "배차 등록", description = "새로운 배차를 등록합니다 (직원/관리자/발주처)")
    public ResponseEntity<ApiResponse<DispatchResponse>> createDispatch(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody DispatchCreateRequest request) {

        DispatchResponse response = dispatchService.createDispatch(userDetails.getUserId(), request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("배차가 등록되었습니다", response));
    }

    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN', 'COMPANY')")
    @Operation(summary = "내가 등록한 배차 목록", description = "본인이 등록한 배차 목록을 조회합니다")
    public ResponseEntity<ApiResponse<List<DispatchResponse>>> getMyDispatches(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        List<DispatchResponse> dispatches = dispatchService.getMyDispatches(userDetails.getUserId());
        return ResponseEntity.ok(ApiResponse.success(dispatches));
    }

    // ========== 기사용 API ==========

    @GetMapping("/available")
    @PreAuthorize("hasRole('DRIVER')")
    @Operation(summary = "가용 배차 목록", description = "수락 가능한 배차 목록을 조회합니다 (기사)")
    public ResponseEntity<ApiResponse<List<DispatchResponse>>> getAvailableDispatches(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude,
            @RequestParam(required = false, defaultValue = "50") Double radiusKm) {

        List<DispatchResponse> dispatches = dispatchService.getAvailableDispatches(
                userDetails.getUserId(), latitude, longitude, radiusKm);
        return ResponseEntity.ok(ApiResponse.success(dispatches));
    }

    @PostMapping("/{id}/accept")
    @PreAuthorize("hasRole('DRIVER')")
    @Operation(summary = "배차 수락", description = "배차를 수락합니다 (기사)")
    public ResponseEntity<ApiResponse<DispatchResponse>> acceptDispatch(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {

        DispatchResponse response = dispatchService.acceptDispatch(userDetails.getUserId(), id);
        return ResponseEntity.ok(ApiResponse.success("배차를 수락했습니다", response));
    }

    @PostMapping("/{id}/depart")
    @PreAuthorize("hasRole('DRIVER')")
    @Operation(summary = "출발", description = "현장으로 출발 처리합니다 (기사)")
    public ResponseEntity<ApiResponse<DispatchResponse>> departForSite(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {

        DispatchResponse response = dispatchService.departForSite(userDetails.getUserId(), id);
        return ResponseEntity.ok(ApiResponse.success("출발 처리되었습니다", response));
    }

    @PostMapping("/{id}/arrive")
    @PreAuthorize("hasRole('DRIVER')")
    @Operation(summary = "현장 도착", description = "현장 도착 처리합니다 (기사)")
    public ResponseEntity<ApiResponse<DispatchResponse>> arriveAtSite(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {

        DispatchResponse response = dispatchService.arriveAtSite(userDetails.getUserId(), id);
        return ResponseEntity.ok(ApiResponse.success("도착 처리되었습니다", response));
    }

    @PostMapping("/{id}/start-work")
    @PreAuthorize("hasRole('DRIVER')")
    @Operation(summary = "작업 시작", description = "작업 시작 처리합니다 (기사)")
    public ResponseEntity<ApiResponse<DispatchResponse>> startWork(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {

        DispatchResponse response = dispatchService.startWork(userDetails.getUserId(), id);
        return ResponseEntity.ok(ApiResponse.success("작업이 시작되었습니다", response));
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasRole('DRIVER')")
    @Operation(summary = "작업 완료", description = "작업 완료 처리합니다 (기사)")
    public ResponseEntity<ApiResponse<DispatchResponse>> completeWork(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {

        DispatchResponse response = dispatchService.completeWork(userDetails.getUserId(), id);
        return ResponseEntity.ok(ApiResponse.success("작업이 완료되었습니다", response));
    }

    @PostMapping("/{id}/sign/driver")
    @PreAuthorize("hasRole('DRIVER')")
    @Operation(summary = "기사 서명", description = "작업 확인서에 기사 서명을 합니다")
    public ResponseEntity<ApiResponse<DispatchResponse>> signByDriver(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody SignatureRequest request) {

        DispatchResponse response = dispatchService.signByDriver(userDetails.getUserId(), id, request);
        return ResponseEntity.ok(ApiResponse.success("서명이 완료되었습니다", response));
    }

    @PostMapping("/{id}/sign/client")
    @Operation(summary = "고객 서명", description = "작업 확인서에 고객(현장 담당자) 서명을 합니다")
    public ResponseEntity<ApiResponse<DispatchResponse>> signByClient(
            @PathVariable Long id,
            @Valid @RequestBody SignatureRequest request) {

        DispatchResponse response = dispatchService.signByClient(id, request);
        return ResponseEntity.ok(ApiResponse.success("서명이 완료되었습니다. 작업이 최종 완료되었습니다.", response));
    }

    // ========== 공통 API ==========

    @GetMapping("/{id}")
    @Operation(summary = "배차 상세 조회", description = "배차 상세 정보를 조회합니다")
    public ResponseEntity<ApiResponse<DispatchResponse>> getDispatchDetail(@PathVariable Long id) {
        DispatchResponse response = dispatchService.getDispatchDetail(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/driver/history")
    @PreAuthorize("hasRole('DRIVER')")
    @Operation(summary = "기사 배차 이력", description = "기사의 배차 이력을 조회합니다")
    public ResponseEntity<ApiResponse<List<DispatchResponse>>> getDriverDispatches(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        List<DispatchResponse> dispatches = dispatchService.getDriverDispatches(userDetails.getUserId());
        return ResponseEntity.ok(ApiResponse.success(dispatches));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN', 'COMPANY')")
    @Operation(summary = "배차 취소", description = "배차를 취소합니다")
    public ResponseEntity<ApiResponse<DispatchResponse>> cancelDispatch(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {

        DispatchResponse response = dispatchService.cancelDispatch(userDetails.getUserId(), id);
        return ResponseEntity.ok(ApiResponse.success("배차가 취소되었습니다", response));
    }

    // ========== 발주처 서명/확인 API ==========

    @PostMapping("/{id}/sign/company")
    @PreAuthorize("hasAnyRole('COMPANY', 'STAFF')")
    @Operation(summary = "발주처 확인/서명", description = "작업 확인서에 발주처가 서명하여 확인합니다")
    public ResponseEntity<ApiResponse<DispatchResponse>> signByCompany(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody SignatureRequest request) {

        DispatchResponse response = dispatchService.signByCompany(userDetails.getUserId(), id, request);
        return ResponseEntity.ok(ApiResponse.success("발주처 확인이 완료되었습니다", response));
    }

    // ========== 작업 확인서 API ==========

    @GetMapping("/{id}/work-report")
    @Operation(summary = "작업 확인서 조회", description = "작업 확인서 상세 정보를 조회합니다")
    public ResponseEntity<ApiResponse<WorkReportResponse>> getWorkReport(@PathVariable Long id) {
        WorkReportResponse response = dispatchService.getWorkReport(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/company/work-reports")
    @PreAuthorize("hasAnyRole('COMPANY', 'STAFF')")
    @Operation(summary = "발주처 작업 확인서 목록", description = "발주처의 완료된 작업 확인서 목록을 조회합니다")
    public ResponseEntity<ApiResponse<List<WorkReportResponse>>> getCompanyWorkReports(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        List<WorkReportResponse> reports = dispatchService.getCompanyCompletedDispatches(userDetails.getUserId());
        return ResponseEntity.ok(ApiResponse.success(reports));
    }
}
