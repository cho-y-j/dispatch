package com.dispatch.controller;

import com.dispatch.dto.ApiResponse;
import com.dispatch.entity.DispatchMatch;
import com.dispatch.entity.DispatchRequest;
import com.dispatch.exception.CustomException;
import com.dispatch.repository.DispatchMatchRepository;
import com.dispatch.repository.DispatchRequestRepository;
import com.dispatch.security.CustomUserDetails;
import com.dispatch.service.PdfGenerationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Tag(name = "리포트", description = "작업 확인서 및 리포트 관련 API")
public class ReportController {

    private final DispatchRequestRepository dispatchRequestRepository;
    private final DispatchMatchRepository dispatchMatchRepository;
    private final PdfGenerationService pdfGenerationService;

    @Value("${file.upload-dir:./uploads}")
    private String uploadDir;

    @PostMapping("/dispatches/{dispatchId}/generate")
    @PreAuthorize("hasAnyRole('DRIVER', 'STAFF', 'ADMIN')")
    @Operation(summary = "작업 확인서 재생성", description = "완료된 배차의 작업 확인서 PDF를 재생성합니다")
    public ResponseEntity<ApiResponse<Map<String, String>>> regenerateWorkReport(
            @PathVariable Long dispatchId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        DispatchRequest request = dispatchRequestRepository.findById(dispatchId)
                .orElseThrow(() -> CustomException.notFound("배차를 찾을 수 없습니다"));

        DispatchMatch match = dispatchMatchRepository.findByRequest(request)
                .orElseThrow(() -> CustomException.notFound("매칭 정보를 찾을 수 없습니다"));

        if (match.getStatus() != DispatchMatch.MatchStatus.SIGNED) {
            throw CustomException.badRequest("서명이 완료된 배차만 작업 확인서를 생성할 수 있습니다");
        }

        try {
            String pdfUrl = pdfGenerationService.generateWorkReport(match);
            match.setWorkReportUrl(pdfUrl);
            dispatchMatchRepository.save(match);

            log.info("Work report regenerated: dispatchId={}, url={}", dispatchId, pdfUrl);
            return ResponseEntity.ok(ApiResponse.success(
                    "작업 확인서가 생성되었습니다",
                    Map.of("url", pdfUrl)
            ));

        } catch (IOException e) {
            log.error("Failed to generate work report: {}", e.getMessage());
            throw CustomException.serverError("PDF 생성 실패: " + e.getMessage());
        }
    }

    @GetMapping("/dispatches/{dispatchId}/download")
    @PreAuthorize("hasAnyRole('DRIVER', 'STAFF', 'ADMIN')")
    @Operation(summary = "작업 확인서 다운로드", description = "완료된 배차의 작업 확인서 PDF를 다운로드합니다")
    public ResponseEntity<Resource> downloadWorkReport(
            @PathVariable Long dispatchId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        DispatchRequest request = dispatchRequestRepository.findById(dispatchId)
                .orElseThrow(() -> CustomException.notFound("배차를 찾을 수 없습니다"));

        DispatchMatch match = dispatchMatchRepository.findByRequest(request)
                .orElseThrow(() -> CustomException.notFound("매칭 정보를 찾을 수 없습니다"));

        if (match.getWorkReportUrl() == null) {
            throw CustomException.notFound("작업 확인서가 아직 생성되지 않았습니다");
        }

        try {
            // URL에서 파일명 추출
            String fileName = match.getWorkReportUrl().substring(match.getWorkReportUrl().lastIndexOf("/") + 1);
            Path filePath = Paths.get(uploadDir, "reports", fileName);
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists()) {
                throw CustomException.notFound("파일을 찾을 수 없습니다");
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"work-report-" + dispatchId + ".pdf\"")
                    .body(resource);

        } catch (MalformedURLException e) {
            log.error("Failed to download work report: {}", e.getMessage());
            throw CustomException.serverError("파일 다운로드 실패");
        }
    }

    @GetMapping("/dispatches/{dispatchId}/view")
    @Operation(summary = "작업 확인서 보기", description = "완료된 배차의 작업 확인서 PDF를 브라우저에서 봅니다")
    public ResponseEntity<Resource> viewWorkReport(@PathVariable Long dispatchId) {

        DispatchRequest request = dispatchRequestRepository.findById(dispatchId)
                .orElseThrow(() -> CustomException.notFound("배차를 찾을 수 없습니다"));

        DispatchMatch match = dispatchMatchRepository.findByRequest(request)
                .orElseThrow(() -> CustomException.notFound("매칭 정보를 찾을 수 없습니다"));

        if (match.getWorkReportUrl() == null) {
            throw CustomException.notFound("작업 확인서가 아직 생성되지 않았습니다");
        }

        try {
            String fileName = match.getWorkReportUrl().substring(match.getWorkReportUrl().lastIndexOf("/") + 1);
            Path filePath = Paths.get(uploadDir, "reports", fileName);
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists()) {
                throw CustomException.notFound("파일을 찾을 수 없습니다");
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"work-report-" + dispatchId + ".pdf\"")
                    .body(resource);

        } catch (MalformedURLException e) {
            log.error("Failed to view work report: {}", e.getMessage());
            throw CustomException.serverError("파일 조회 실패");
        }
    }
}
