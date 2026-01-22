package com.dispatch.service;

import com.dispatch.dto.admin.WarningRequest;
import com.dispatch.dto.admin.WarningResponse;
import com.dispatch.entity.Driver;
import com.dispatch.entity.Company;
import com.dispatch.entity.SystemSetting;
import com.dispatch.entity.Warning;
import com.dispatch.exception.CustomException;
import com.dispatch.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class WarningService {

    private final WarningRepository warningRepository;
    private final DriverRepository driverRepository;
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final SystemSettingRepository systemSettingRepository;
    private final SuspensionService suspensionService;

    /**
     * 경고 부여
     */
    @Transactional
    public WarningResponse createWarning(WarningRequest request, Long adminId) {
        // 대상 존재 여부 확인
        if (request.getUserType() == Warning.UserType.DRIVER) {
            Driver driver = driverRepository.findById(request.getUserId())
                    .orElseThrow(() -> CustomException.notFound("기사를 찾을 수 없습니다"));

            // 기사 경고 횟수 증가
            driver.setWarningCount(driver.getWarningCount() + 1);
        } else {
            Company company = companyRepository.findById(request.getUserId())
                    .orElseThrow(() -> CustomException.notFound("발주처를 찾을 수 없습니다"));

            // 발주처 경고 횟수 증가
            company.setWarningCount(company.getWarningCount() + 1);
        }

        Warning warning = Warning.builder()
                .userId(request.getUserId())
                .userType(request.getUserType())
                .type(request.getType())
                .reason(request.getReason())
                .dispatchId(request.getDispatchId())
                .createdBy(adminId)
                .build();

        warningRepository.save(warning);

        log.info("Warning created: userId={}, userType={}, type={}, adminId={}",
                request.getUserId(), request.getUserType(), request.getType(), adminId);

        // 자동 정지 체크
        checkAutoSuspension(request.getUserId(), request.getUserType(), adminId);

        return buildWarningResponse(warning);
    }

    /**
     * 경고 목록 조회
     */
    @Transactional(readOnly = true)
    public List<WarningResponse> getAllWarnings() {
        return warningRepository.findAllOrderByCreatedAtDesc()
                .stream()
                .map(this::buildWarningResponse)
                .toList();
    }

    /**
     * 특정 사용자의 경고 목록
     */
    @Transactional(readOnly = true)
    public List<WarningResponse> getWarningsByUser(Long userId, Warning.UserType userType) {
        return warningRepository.findByUserIdAndUserTypeOrderByCreatedAtDesc(userId, userType)
                .stream()
                .map(this::buildWarningResponse)
                .toList();
    }

    /**
     * 경고 상세 조회
     */
    @Transactional(readOnly = true)
    public WarningResponse getWarning(Long warningId) {
        Warning warning = warningRepository.findById(warningId)
                .orElseThrow(() -> CustomException.notFound("경고를 찾을 수 없습니다"));
        return buildWarningResponse(warning);
    }

    /**
     * 자동 정지 체크
     */
    private void checkAutoSuspension(Long userId, Warning.UserType userType, Long adminId) {
        int warningCount = warningRepository.countByUserIdAndUserType(userId, userType);

        // 시스템 설정에서 정지 기준 조회
        int threshold1 = getSettingIntValue("warning_threshold_1", 3);
        int suspensionDays1 = getSettingIntValue("suspension_days_1", 3);
        int threshold2 = getSettingIntValue("warning_threshold_2", 5);
        int suspensionDays2 = getSettingIntValue("suspension_days_2", 7);

        if (warningCount >= threshold2) {
            // 2차 자동 정지
            suspensionService.createAutoSuspension(userId, userType, suspensionDays2,
                    "경고 " + warningCount + "회 누적으로 인한 자동 정지", adminId);
            log.info("Auto suspension (level 2) applied: userId={}, userType={}, days={}",
                    userId, userType, suspensionDays2);
        } else if (warningCount >= threshold1) {
            // 1차 자동 정지
            suspensionService.createAutoSuspension(userId, userType, suspensionDays1,
                    "경고 " + warningCount + "회 누적으로 인한 자동 정지", adminId);
            log.info("Auto suspension (level 1) applied: userId={}, userType={}, days={}",
                    userId, userType, suspensionDays1);
        }
    }

    private int getSettingIntValue(String key, int defaultValue) {
        return systemSettingRepository.findBySettingKey(key)
                .map(s -> Integer.parseInt(s.getSettingValue()))
                .orElse(defaultValue);
    }

    private WarningResponse buildWarningResponse(Warning warning) {
        WarningResponse response = WarningResponse.from(warning);

        // 사용자 이름 조회
        if (warning.getUserType() == Warning.UserType.DRIVER) {
            driverRepository.findById(warning.getUserId())
                    .ifPresent(driver -> response.setUserName(driver.getUser().getName()));
        } else {
            companyRepository.findById(warning.getUserId())
                    .ifPresent(company -> response.setUserName(company.getName()));
        }

        // 생성자 이름 조회
        userRepository.findById(warning.getCreatedBy())
                .ifPresent(user -> response.setCreatedByName(user.getName()));

        return response;
    }
}
