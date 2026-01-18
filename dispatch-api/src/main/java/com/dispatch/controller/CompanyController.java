package com.dispatch.controller;

import com.dispatch.dto.ApiResponse;
import com.dispatch.dto.company.CompanyRegisterRequest;
import com.dispatch.dto.company.CompanyResponse;
import com.dispatch.dto.statistics.CompanyStatistics;
import com.dispatch.security.CustomUserDetails;
import com.dispatch.service.CompanyService;
import com.dispatch.service.StatisticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/companies")
@RequiredArgsConstructor
@Tag(name = "발주처", description = "발주처(업체) 관련 API")
public class CompanyController {

    private final CompanyService companyService;
    private final StatisticsService statisticsService;

    @PostMapping("/register")
    @Operation(summary = "발주처 회원가입", description = "발주처(업체)가 직접 회원가입합니다")
    public ResponseEntity<ApiResponse<CompanyResponse>> register(
            @Valid @RequestBody CompanyRegisterRequest request) {

        CompanyResponse response = companyService.register(request);
        return ResponseEntity.ok(ApiResponse.success("회원가입이 완료되었습니다. 관리자 승인 후 이용 가능합니다.", response));
    }

    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('COMPANY', 'STAFF')")
    @Operation(summary = "내 회사 정보 조회", description = "로그인한 사용자의 소속 회사 정보를 조회합니다")
    public ResponseEntity<ApiResponse<CompanyResponse>> getMyCompany(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        CompanyResponse response = companyService.getMyCompany(userDetails.getUserId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/my/business-license")
    @PreAuthorize("hasAnyRole('COMPANY', 'STAFF')")
    @Operation(summary = "사업자등록증 업로드", description = "사업자등록증 이미지를 업로드합니다")
    public ResponseEntity<ApiResponse<CompanyResponse>> uploadBusinessLicense(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam("file") MultipartFile file) {

        CompanyResponse myCompany = companyService.getMyCompany(userDetails.getUserId());
        CompanyResponse response = companyService.uploadBusinessLicense(myCompany.getId(), file);
        return ResponseEntity.ok(ApiResponse.success("사업자등록증이 업로드되었습니다", response));
    }

    @GetMapping("/statistics")
    @PreAuthorize("hasAnyRole('COMPANY', 'STAFF')")
    @Operation(summary = "내 발주처 통계", description = "로그인한 사용자 소속 발주처의 통계를 조회합니다")
    public ResponseEntity<ApiResponse<CompanyStatistics>> getMyCompanyStatistics(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        CompanyStatistics stats = statisticsService.getMyCompanyStatistics(userDetails.getUserId());
        return ResponseEntity.ok(ApiResponse.success(stats));
    }
}
