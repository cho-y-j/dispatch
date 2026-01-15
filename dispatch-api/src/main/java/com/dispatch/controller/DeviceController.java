package com.dispatch.controller;

import com.dispatch.dto.ApiResponse;
import com.dispatch.dto.fcm.DeviceTokenRequest;
import com.dispatch.entity.User;
import com.dispatch.exception.CustomException;
import com.dispatch.repository.UserRepository;
import com.dispatch.security.CustomUserDetails;
import com.dispatch.service.FcmService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/devices")
@RequiredArgsConstructor
@Tag(name = "디바이스", description = "디바이스 토큰 관리 API")
public class DeviceController {

    private final FcmService fcmService;
    private final UserRepository userRepository;

    @PostMapping("/token")
    @Operation(summary = "FCM 토큰 등록", description = "푸시 알림을 받기 위한 FCM 토큰을 등록합니다")
    public ResponseEntity<ApiResponse<Void>> registerToken(
            @Valid @RequestBody DeviceTokenRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        User user = userRepository.findById(userDetails.getUserId())
                .orElseThrow(() -> CustomException.notFound("사용자를 찾을 수 없습니다"));

        fcmService.registerToken(user, request.getToken(), request.getDeviceType());

        return ResponseEntity.ok(ApiResponse.success("토큰이 등록되었습니다", null));
    }

    @DeleteMapping("/token")
    @Operation(summary = "FCM 토큰 삭제", description = "등록된 FCM 토큰을 삭제합니다 (로그아웃 시)")
    public ResponseEntity<ApiResponse<Void>> deleteToken(
            @RequestParam String token,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        fcmService.deactivateToken(token);

        return ResponseEntity.ok(ApiResponse.success("토큰이 삭제되었습니다", null));
    }

    @DeleteMapping("/tokens")
    @Operation(summary = "모든 FCM 토큰 삭제", description = "현재 사용자의 모든 FCM 토큰을 삭제합니다")
    public ResponseEntity<ApiResponse<Void>> deleteAllTokens(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        fcmService.deactivateUserTokens(userDetails.getUserId());

        return ResponseEntity.ok(ApiResponse.success("모든 토큰이 삭제되었습니다", null));
    }
}
