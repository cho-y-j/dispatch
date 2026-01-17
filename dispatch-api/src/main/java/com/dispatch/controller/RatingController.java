package com.dispatch.controller;

import com.dispatch.dto.ApiResponse;
import com.dispatch.dto.rating.RatingRequest;
import com.dispatch.dto.rating.RatingResponse;
import com.dispatch.security.CustomUserDetails;
import com.dispatch.service.RatingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "평가", description = "기사 평가 API")
public class RatingController {

    private final RatingService ratingService;

    @PostMapping("/api/dispatches/{dispatchId}/rating")
    @Operation(summary = "기사 평가", description = "완료된 배차에 대해 기사를 평가합니다")
    public ResponseEntity<ApiResponse<RatingResponse>> createRating(
            @PathVariable Long dispatchId,
            @Valid @RequestBody RatingRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        RatingResponse response = ratingService.createRating(dispatchId, request, userDetails.getUserId());
        return ResponseEntity.ok(ApiResponse.success("평가가 등록되었습니다", response));
    }

    @GetMapping("/api/dispatches/{dispatchId}/rating")
    @Operation(summary = "배차 평가 조회", description = "배차에 대한 평가를 조회합니다")
    public ResponseEntity<ApiResponse<RatingResponse>> getRatingByDispatch(
            @PathVariable Long dispatchId) {

        RatingResponse response = ratingService.getRatingByDispatch(dispatchId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/api/drivers/{driverId}/ratings")
    @Operation(summary = "기사 평가 목록", description = "기사의 모든 평가를 조회합니다")
    public ResponseEntity<ApiResponse<List<RatingResponse>>> getRatingsByDriver(
            @PathVariable Long driverId) {

        List<RatingResponse> ratings = ratingService.getRatingsByDriver(driverId);
        return ResponseEntity.ok(ApiResponse.success(ratings));
    }
}
