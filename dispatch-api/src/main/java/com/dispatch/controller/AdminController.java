package com.dispatch.controller;

import com.dispatch.dto.ApiResponse;
import com.dispatch.dto.driver.DriverResponse;
import com.dispatch.security.CustomUserDetails;
import com.dispatch.service.DriverService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "관리자", description = "관리자 전용 API")
public class AdminController {

    private final DriverService driverService;

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
}
