package com.dispatch.service;

import com.dispatch.dto.settings.SystemSettingRequest;
import com.dispatch.dto.settings.SystemSettingResponse;
import com.dispatch.entity.SystemSetting;
import com.dispatch.exception.CustomException;
import com.dispatch.repository.SystemSettingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class SystemSettingService {

    private final SystemSettingRepository settingRepository;

    // 기본 설정 키 및 값
    private static final Map<String, String> DEFAULT_SETTINGS = Map.ofEntries(
            Map.entry("grade_2_delay_minutes", "5"),
            Map.entry("grade_3_delay_minutes", "15"),
            Map.entry("warning_threshold_1", "3"),
            Map.entry("suspension_days_1", "3"),
            Map.entry("warning_threshold_2", "5"),
            Map.entry("suspension_days_2", "7"),
            Map.entry("urgent_dispatch_exposure_minutes", "60"),
            Map.entry("chat_retention_days", "7"),
            Map.entry("default_dispatch_radius_km", "50")
    );

    private static final Map<String, String> SETTING_DESCRIPTIONS = Map.ofEntries(
            Map.entry("grade_2_delay_minutes", "2등급 기사 배차 노출 지연 시간 (분)"),
            Map.entry("grade_3_delay_minutes", "3등급 기사 배차 노출 지연 시간 (분)"),
            Map.entry("warning_threshold_1", "1차 자동 정지 경고 횟수"),
            Map.entry("suspension_days_1", "1차 자동 정지 기간 (일)"),
            Map.entry("warning_threshold_2", "2차 자동 정지 경고 횟수"),
            Map.entry("suspension_days_2", "2차 자동 정지 기간 (일)"),
            Map.entry("urgent_dispatch_exposure_minutes", "긴급 배차 노출 시간 (분)"),
            Map.entry("chat_retention_days", "채팅 메시지 보관 기간 (일)"),
            Map.entry("default_dispatch_radius_km", "기본 배차 검색 반경 (km)")
    );

    /**
     * 서버 시작 시 기본 설정 초기화
     */
    @PostConstruct
    @Transactional
    public void initializeDefaultSettings() {
        DEFAULT_SETTINGS.forEach((key, value) -> {
            if (!settingRepository.existsBySettingKey(key)) {
                SystemSetting setting = SystemSetting.builder()
                        .settingKey(key)
                        .settingValue(value)
                        .description(SETTING_DESCRIPTIONS.get(key))
                        .build();
                settingRepository.save(setting);
                log.info("Initialized default setting: {}={}", key, value);
            }
        });
    }

    /**
     * 모든 설정 조회
     */
    @Transactional(readOnly = true)
    public List<SystemSettingResponse> getAllSettings() {
        return settingRepository.findAll()
                .stream()
                .map(SystemSettingResponse::from)
                .toList();
    }

    /**
     * 특정 설정 조회
     */
    @Transactional(readOnly = true)
    public SystemSettingResponse getSetting(String key) {
        SystemSetting setting = settingRepository.findBySettingKey(key)
                .orElseThrow(() -> CustomException.notFound("설정을 찾을 수 없습니다: " + key));
        return SystemSettingResponse.from(setting);
    }

    /**
     * 설정 값 조회 (내부용)
     */
    @Transactional(readOnly = true)
    public String getSettingValue(String key) {
        return settingRepository.findBySettingKey(key)
                .map(SystemSetting::getSettingValue)
                .orElse(DEFAULT_SETTINGS.get(key));
    }

    /**
     * 설정 값 조회 (정수)
     */
    @Transactional(readOnly = true)
    public int getSettingIntValue(String key, int defaultValue) {
        try {
            String value = getSettingValue(key);
            return value != null ? Integer.parseInt(value) : defaultValue;
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    /**
     * 설정 수정
     */
    @Transactional
    public SystemSettingResponse updateSetting(String key, SystemSettingRequest request, Long adminId) {
        SystemSetting setting = settingRepository.findBySettingKey(key)
                .orElseThrow(() -> CustomException.notFound("설정을 찾을 수 없습니다: " + key));

        setting.setSettingValue(request.getSettingValue());
        if (request.getDescription() != null) {
            setting.setDescription(request.getDescription());
        }
        setting.setUpdatedBy(adminId);

        log.info("Setting updated: key={}, value={}, adminId={}", key, request.getSettingValue(), adminId);

        return SystemSettingResponse.from(setting);
    }

    /**
     * 등급별 배차 지연 시간 조회
     */
    @Transactional(readOnly = true)
    public Map<String, Integer> getGradeDelaySettings() {
        return Map.of(
                "GRADE_2", getSettingIntValue("grade_2_delay_minutes", 5),
                "GRADE_3", getSettingIntValue("grade_3_delay_minutes", 15)
        );
    }
}
