package com.dispatch.controller;

import com.dispatch.dto.ApiResponse;
import com.dispatch.dto.verify.CargoVerifyRequest;
import com.dispatch.dto.verify.VerifyResponse;
import com.dispatch.service.VerifyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/verify")
@RequiredArgsConstructor
@Tag(name = "자격증 검증", description = "자격증 진위여부 검증 API")
public class VerifyController {

    private final VerifyService verifyService;

    @PostMapping("/cargo")
    @PreAuthorize("hasAnyRole('DRIVER', 'ADMIN')")
    @Operation(summary = "화물운송 자격증 검증", description = "화물운송(운수종사자) 자격증의 진위여부를 검증합니다")
    public ResponseEntity<ApiResponse<VerifyResponse>> verifyCargo(
            @Valid @RequestBody CargoVerifyRequest request) {

        VerifyResponse response = verifyService.verifyCargo(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping(value = "/kosha", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('DRIVER', 'ADMIN')")
    @Operation(summary = "KOSHA 교육이수증 검증",
            description = "교육이수증 이미지(QR 코드 포함)를 업로드하여 진위여부를 검증합니다")
    public ResponseEntity<ApiResponse<VerifyResponse>> verifyKosha(
            @RequestParam("image") MultipartFile image) {

        VerifyResponse response = verifyService.verifyKosha(image);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/business-registration")
    @PreAuthorize("hasAnyRole('DRIVER', 'ADMIN')")
    @Operation(summary = "사업자등록번호 검증",
            description = "사업자등록번호의 유효성을 검증합니다 (현재 형식 검증만 지원)")
    public ResponseEntity<ApiResponse<VerifyResponse>> verifyBusinessRegistration(
            @RequestParam String businessNumber) {

        VerifyResponse response = verifyService.verifyBusinessRegistration(businessNumber);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/driver-license")
    @PreAuthorize("hasAnyRole('DRIVER', 'ADMIN')")
    @Operation(summary = "운전면허 검증",
            description = "운전면허의 진위여부를 검증합니다 (미구현)")
    public ResponseEntity<ApiResponse<VerifyResponse>> verifyDriverLicense(
            @RequestParam String licenseNumber,
            @RequestParam String name,
            @RequestParam String birth) {

        VerifyResponse response = verifyService.verifyDriverLicense(licenseNumber, name, birth);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
