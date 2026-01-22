package com.dispatch.controller;

import com.dispatch.dto.ApiResponse;
import com.dispatch.dto.verify.*;
import com.dispatch.entity.DriverVerification;
import com.dispatch.security.CustomUserDetails;
import com.dispatch.service.VerifyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/admin/verifications")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'COMPANY')")
@Tag(name = "인원 관리 - 검증", description = "기사 서류 검증 관리 API (Admin, Company)")
public class VerificationController {

    private final VerifyService verifyService;

    // ==================== 기사 목록 조회 ====================

    @GetMapping("/drivers")
    @Operation(summary = "검증 대상 기사 목록", description = "모든 기사의 검증 상태 요약 목록을 조회합니다")
    public ResponseEntity<ApiResponse<List<DriverVerificationSummary>>> getDriversForVerification() {
        List<DriverVerificationSummary> summaries = verifyService.getAllDriverVerificationSummaries();
        return ResponseEntity.ok(ApiResponse.success(summaries));
    }

    @GetMapping("/drivers/{id}")
    @Operation(summary = "기사 검증 상태 상세", description = "특정 기사의 검증 상태 상세 정보를 조회합니다")
    public ResponseEntity<ApiResponse<DriverVerificationSummary>> getDriverVerificationDetail(
            @PathVariable Long id) {
        DriverVerificationSummary summary = verifyService.getDriverVerificationSummary(id);
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    @GetMapping("/drivers/{id}/history")
    @Operation(summary = "기사 검증 이력", description = "특정 기사의 모든 검증 이력을 조회합니다")
    public ResponseEntity<ApiResponse<List<DriverVerificationResponse>>> getDriverVerificationHistory(
            @PathVariable Long id) {
        List<DriverVerificationResponse> history = verifyService.getVerificationHistory(id);
        return ResponseEntity.ok(ApiResponse.success(history));
    }

    // ==================== 운전면허 검증 ====================

    @PostMapping("/drivers/{id}/license")
    @Operation(summary = "운전면허 검증", description = "RIMS API를 통해 운전면허를 검증합니다")
    public ResponseEntity<ApiResponse<VerifyResponse>> verifyDriverLicense(
            @PathVariable Long id,
            @Valid @RequestBody RimsLicenseRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        VerifyResponse response = verifyService.verifyDriverLicenseRims(request);

        // 검증 이력 저장
        verifyService.saveVerificationHistory(
                id,
                DriverVerification.VerificationType.LICENSE,
                response,
                userDetails.getUserId()
        );

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ==================== 사업자등록 검증 ====================

    @PostMapping("/drivers/{id}/business")
    @Operation(summary = "사업자등록 검증", description = "국세청 API를 통해 사업자등록을 검증합니다")
    public ResponseEntity<ApiResponse<VerifyResponse>> verifyBusinessRegistration(
            @PathVariable Long id,
            @Valid @RequestBody BizVerifyRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        VerifyResponse response = verifyService.verifyBusinessRegistrationNts(request);

        // 검증 이력 저장
        verifyService.saveVerificationHistory(
                id,
                DriverVerification.VerificationType.BUSINESS,
                response,
                userDetails.getUserId()
        );

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ==================== KOSHA 교육이수증 검증 ====================

    @PostMapping(value = "/drivers/{id}/kosha", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "KOSHA 교육이수증 검증", description = "교육이수증 이미지를 업로드하여 검증합니다")
    public ResponseEntity<ApiResponse<VerifyResponse>> verifyKosha(
            @PathVariable Long id,
            @RequestParam("image") MultipartFile image,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        VerifyResponse response = verifyService.verifyKosha(image);

        // 검증 이력 저장
        verifyService.saveVerificationHistory(
                id,
                DriverVerification.VerificationType.KOSHA,
                response,
                userDetails.getUserId()
        );

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ==================== 화물운송 자격증 검증 ====================

    @PostMapping("/drivers/{id}/cargo")
    @Operation(summary = "화물운송 자격증 검증", description = "화물운송 자격증을 검증합니다")
    public ResponseEntity<ApiResponse<VerifyResponse>> verifyCargo(
            @PathVariable Long id,
            @Valid @RequestBody CargoVerifyRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        VerifyResponse response = verifyService.verifyCargo(request);

        // 검증 이력 저장
        verifyService.saveVerificationHistory(
                id,
                DriverVerification.VerificationType.CARGO,
                response,
                userDetails.getUserId()
        );

        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
