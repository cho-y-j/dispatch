package com.dispatch.service;

import com.dispatch.dto.admin.SuspensionRequest;
import com.dispatch.dto.admin.SuspensionResponse;
import com.dispatch.entity.*;
import com.dispatch.exception.CustomException;
import com.dispatch.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SuspensionService {

    private final SuspensionRepository suspensionRepository;
    private final DriverRepository driverRepository;
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;

    /**
     * 정지 처리
     */
    @Transactional
    public SuspensionResponse createSuspension(SuspensionRequest request, Long adminId) {
        // 이미 활성 정지가 있는지 확인
        if (suspensionRepository.existsByUserIdAndUserTypeAndIsActiveTrue(request.getUserId(), request.getUserType())) {
            throw CustomException.conflict("이미 정지 상태입니다");
        }

        LocalDateTime startDate = LocalDateTime.now();
        LocalDateTime endDate = null;

        if (request.getType() == Suspension.SuspensionType.TEMP) {
            if (request.getEndDate() != null) {
                endDate = request.getEndDate();
            } else if (request.getDays() != null) {
                endDate = startDate.plusDays(request.getDays());
            } else {
                throw CustomException.badRequest("임시 정지는 종료일 또는 정지 기간이 필요합니다");
            }
        }

        Suspension suspension = Suspension.builder()
                .userId(request.getUserId())
                .userType(request.getUserType())
                .type(request.getType())
                .reason(request.getReason())
                .startDate(startDate)
                .endDate(endDate)
                .isActive(true)
                .createdBy(adminId)
                .build();

        suspensionRepository.save(suspension);

        // 사용자/발주처 상태 변경
        updateUserStatus(request.getUserId(), request.getUserType(), User.UserStatus.SUSPENDED);

        log.info("Suspension created: userId={}, userType={}, type={}, adminId={}",
                request.getUserId(), request.getUserType(), request.getType(), adminId);

        return buildSuspensionResponse(suspension);
    }

    /**
     * 자동 정지 (경고 누적 시)
     */
    @Transactional
    public void createAutoSuspension(Long userId, Warning.UserType userType, int days, String reason, Long adminId) {
        // 이미 활성 정지가 있으면 스킵
        if (suspensionRepository.existsByUserIdAndUserTypeAndIsActiveTrue(userId, userType)) {
            return;
        }

        LocalDateTime startDate = LocalDateTime.now();
        LocalDateTime endDate = startDate.plusDays(days);

        Suspension suspension = Suspension.builder()
                .userId(userId)
                .userType(userType)
                .type(Suspension.SuspensionType.TEMP)
                .reason(reason)
                .startDate(startDate)
                .endDate(endDate)
                .isActive(true)
                .createdBy(adminId)
                .build();

        suspensionRepository.save(suspension);

        // 사용자/발주처 상태 변경
        updateUserStatus(userId, userType, User.UserStatus.SUSPENDED);

        log.info("Auto suspension created: userId={}, userType={}, days={}", userId, userType, days);
    }

    /**
     * 정지 해제
     */
    @Transactional
    public SuspensionResponse liftSuspension(Long suspensionId, Long adminId) {
        Suspension suspension = suspensionRepository.findById(suspensionId)
                .orElseThrow(() -> CustomException.notFound("정지 정보를 찾을 수 없습니다"));

        if (!suspension.getIsActive()) {
            throw CustomException.badRequest("이미 해제된 정지입니다");
        }

        suspension.setIsActive(false);
        suspension.setLiftedBy(adminId);
        suspension.setLiftedAt(LocalDateTime.now());

        // 사용자/발주처 상태 복원
        updateUserStatus(suspension.getUserId(), suspension.getUserType(), User.UserStatus.APPROVED);

        log.info("Suspension lifted: suspensionId={}, adminId={}", suspensionId, adminId);

        return buildSuspensionResponse(suspension);
    }

    /**
     * 정지 목록 조회
     */
    @Transactional(readOnly = true)
    public List<SuspensionResponse> getAllSuspensions() {
        return suspensionRepository.findAllOrderByCreatedAtDesc()
                .stream()
                .map(this::buildSuspensionResponse)
                .toList();
    }

    /**
     * 활성 정지 목록
     */
    @Transactional(readOnly = true)
    public List<SuspensionResponse> getActiveSuspensions() {
        return suspensionRepository.findAllActiveSuspensions()
                .stream()
                .map(this::buildSuspensionResponse)
                .toList();
    }

    /**
     * 특정 사용자의 정지 이력
     */
    @Transactional(readOnly = true)
    public List<SuspensionResponse> getSuspensionsByUser(Long userId, Warning.UserType userType) {
        return suspensionRepository.findByUserIdAndUserType(userId, userType)
                .stream()
                .map(this::buildSuspensionResponse)
                .toList();
    }

    /**
     * 현재 정지 상태 확인
     */
    @Transactional(readOnly = true)
    public boolean isCurrentlySuspended(Long userId, Warning.UserType userType) {
        return suspensionRepository.findCurrentActiveSuspension(userId, userType, LocalDateTime.now())
                .isPresent();
    }

    /**
     * 만료된 정지 자동 해제 (스케줄러)
     */
    @Scheduled(fixedRate = 3600000) // 1시간마다
    @Transactional
    public void autoLiftExpiredSuspensions() {
        List<Suspension> expiredSuspensions = suspensionRepository.findExpiredSuspensions(LocalDateTime.now());

        for (Suspension suspension : expiredSuspensions) {
            suspension.setIsActive(false);
            suspension.setLiftedAt(LocalDateTime.now());

            // 사용자/발주처 상태 복원
            updateUserStatus(suspension.getUserId(), suspension.getUserType(), User.UserStatus.APPROVED);

            log.info("Auto lifted expired suspension: suspensionId={}", suspension.getId());
        }
    }

    private void updateUserStatus(Long userId, Warning.UserType userType, User.UserStatus status) {
        if (userType == Warning.UserType.DRIVER) {
            driverRepository.findById(userId)
                    .ifPresent(driver -> driver.getUser().setStatus(status));
        } else {
            companyRepository.findById(userId)
                    .ifPresent(company -> {
                        if (status == User.UserStatus.SUSPENDED) {
                            company.setStatus(Company.CompanyStatus.SUSPENDED);
                        } else {
                            company.setStatus(Company.CompanyStatus.APPROVED);
                        }
                        company.getEmployees().forEach(user -> user.setStatus(status));
                    });
        }
    }

    private SuspensionResponse buildSuspensionResponse(Suspension suspension) {
        SuspensionResponse response = SuspensionResponse.from(suspension);

        // 사용자 이름 조회
        if (suspension.getUserType() == Warning.UserType.DRIVER) {
            driverRepository.findById(suspension.getUserId())
                    .ifPresent(driver -> response.setUserName(driver.getUser().getName()));
        } else {
            companyRepository.findById(suspension.getUserId())
                    .ifPresent(company -> response.setUserName(company.getName()));
        }

        // 생성자 이름 조회
        userRepository.findById(suspension.getCreatedBy())
                .ifPresent(user -> response.setCreatedByName(user.getName()));

        return response;
    }
}
