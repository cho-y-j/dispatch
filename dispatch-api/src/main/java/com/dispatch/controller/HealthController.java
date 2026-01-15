package com.dispatch.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@Tag(name = "헬스체크", description = "서버 상태 확인 API")
public class HealthController {

    @GetMapping("/api/health")
    @Operation(summary = "헬스체크", description = "서버 상태를 확인합니다")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "dispatch-api",
                "timestamp", LocalDateTime.now().toString()
        ));
    }
}
