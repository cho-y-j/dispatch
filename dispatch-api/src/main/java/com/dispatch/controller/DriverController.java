package com.dispatch.controller;

import com.dispatch.dto.ApiResponse;
import com.dispatch.dto.driver.DriverRegisterRequest;
import com.dispatch.dto.driver.DriverResponse;
import com.dispatch.dto.driver.LocationUpdateRequest;
import com.dispatch.dto.statistics.DriverStatistics;
import com.dispatch.security.CustomUserDetails;
import com.dispatch.service.DriverService;
import com.dispatch.service.StatisticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/drivers")
@RequiredArgsConstructor
@Tag(name = "기사", description = "기사 등록 및 관리 API")
public class DriverController {

    private final DriverService driverService;
    private final StatisticsService statisticsService;

    @PostMapping("/register")
    @PreAuthorize("hasRole('DRIVER')")
    @Operation(summary = "기사 등록", description = "기사 정보와 장비를 등록합니다")
    public ResponseEntity<ApiResponse<DriverResponse>> register(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody DriverRegisterRequest request) {

        DriverResponse response = driverService.register(userDetails.getUserId(), request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("기사 등록이 완료되었습니다", response));
    }

    @PostMapping(value = "/documents/business-registration", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('DRIVER')")
    @Operation(summary = "사업자등록증 업로드", description = "사업자등록증 이미지를 업로드합니다")
    public ResponseEntity<ApiResponse<DriverResponse>> uploadBusinessRegistration(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam("file") MultipartFile file) {

        DriverResponse response = driverService.uploadBusinessRegistration(userDetails.getUserId(), file);
        return ResponseEntity.ok(ApiResponse.success("사업자등록증이 업로드되었습니다", response));
    }

    @PostMapping(value = "/documents/driver-license", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('DRIVER')")
    @Operation(summary = "운전면허증 업로드", description = "운전면허증 이미지를 업로드합니다")
    public ResponseEntity<ApiResponse<DriverResponse>> uploadDriverLicense(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam("file") MultipartFile file) {

        DriverResponse response = driverService.uploadDriverLicense(userDetails.getUserId(), file);
        return ResponseEntity.ok(ApiResponse.success("운전면허증이 업로드되었습니다", response));
    }

    @GetMapping("/profile")
    @PreAuthorize("hasRole('DRIVER')")
    @Operation(summary = "내 프로필 조회", description = "기사 본인의 프로필을 조회합니다")
    public ResponseEntity<ApiResponse<DriverResponse>> getProfile(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        DriverResponse response = driverService.getProfile(userDetails.getUserId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/location")
    @PreAuthorize("hasRole('DRIVER')")
    @Operation(summary = "위치 업데이트", description = "기사의 현재 위치를 업데이트합니다")
    public ResponseEntity<ApiResponse<DriverResponse>> updateLocation(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody LocationUpdateRequest request) {

        DriverResponse response = driverService.updateLocation(userDetails.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.success("위치가 업데이트되었습니다", response));
    }

    @PutMapping("/active")
    @PreAuthorize("hasRole('DRIVER')")
    @Operation(summary = "활동 상태 변경", description = "기사의 활동 상태를 변경합니다")
    public ResponseEntity<ApiResponse<DriverResponse>> setActive(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam boolean active) {

        DriverResponse response = driverService.setActive(userDetails.getUserId(), active);
        String message = active ? "활동 상태로 변경되었습니다" : "비활동 상태로 변경되었습니다";
        return ResponseEntity.ok(ApiResponse.success(message, response));
    }

    @GetMapping("/statistics")
    @PreAuthorize("hasRole('DRIVER')")
    @Operation(summary = "내 통계", description = "기사 본인의 통계를 조회합니다")
    public ResponseEntity<ApiResponse<DriverStatistics>> getMyStatistics(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        DriverStatistics statistics = statisticsService.getMyDriverStatistics(userDetails.getUserId());
        return ResponseEntity.ok(ApiResponse.success(statistics));
    }
}
