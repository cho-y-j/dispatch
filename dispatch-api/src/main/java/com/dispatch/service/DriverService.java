package com.dispatch.service;

import com.dispatch.dto.driver.DriverRegisterRequest;
import com.dispatch.dto.driver.DriverResponse;
import com.dispatch.dto.driver.LocationUpdateRequest;
import com.dispatch.entity.Driver;
import com.dispatch.entity.Equipment;
import com.dispatch.entity.User;
import com.dispatch.exception.CustomException;
import com.dispatch.repository.DriverRepository;
import com.dispatch.repository.EquipmentRepository;
import com.dispatch.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.dispatch.dto.verify.VerifyResponse;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class DriverService {

    private final DriverRepository driverRepository;
    private final UserRepository userRepository;
    private final EquipmentRepository equipmentRepository;
    private final FileStorageService fileStorageService;
    private final NotificationService notificationService;
    private final VerifyService verifyService;

    @Transactional
    public DriverResponse register(Long userId, DriverRegisterRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> CustomException.notFound("사용자를 찾을 수 없습니다"));

        if (user.getRole() != User.UserRole.DRIVER) {
            throw CustomException.badRequest("기사 역할의 사용자만 등록할 수 있습니다");
        }

        if (driverRepository.findByUserId(userId).isPresent()) {
            throw CustomException.conflict("이미 기사 등록이 되어있습니다");
        }

        // 사업자등록번호 검증
        String verificationMessage = null;
        if (request.getBusinessRegistrationNumber() != null) {
            VerifyResponse verifyResult = verifyService.verifyBusinessRegistration(
                    request.getBusinessRegistrationNumber().replaceAll("-", ""));

            if (verifyResult.getResult() == VerifyResponse.VerifyResult.INVALID) {
                verificationMessage = "사업자등록번호 검증 실패: " + verifyResult.getMessage();
                log.warn("Business registration verification failed: {}", verificationMessage);
            } else if (verifyResult.getResult() == VerifyResponse.VerifyResult.VALID) {
                verificationMessage = "사업자등록번호 검증 완료";
            }
        }

        // 기사 정보 생성
        Driver driver = Driver.builder()
                .user(user)
                .businessRegistrationNumber(request.getBusinessRegistrationNumber())
                .businessName(request.getBusinessName())
                .driverLicenseNumber(request.getDriverLicenseNumber())
                .verificationStatus(Driver.VerificationStatus.PENDING)
                .verificationMessage(verificationMessage)
                .isActive(false)
                .build();

        driverRepository.save(driver);

        // 장비 정보 생성
        Equipment equipment = Equipment.builder()
                .driver(driver)
                .type(request.getEquipmentType())
                .model(request.getEquipmentModel())
                .tonnage(request.getTonnage())
                .maxHeight(request.getMaxHeight())
                .vehicleNumber(request.getVehicleNumber())
                .status(Equipment.EquipmentStatus.ACTIVE)
                .build();

        equipmentRepository.save(equipment);
        driver.getEquipments().add(equipment);

        log.info("Driver registered: userId={}, driverId={}", userId, driver.getId());

        return DriverResponse.from(driver);
    }

    @Transactional
    public DriverResponse uploadBusinessRegistration(Long userId, MultipartFile file) {
        Driver driver = getDriverByUserId(userId);

        String filePath = fileStorageService.storeFile(file, "business-registration");
        driver.setBusinessRegistrationImage(filePath);

        // 검증 상태 업데이트
        updateVerificationStatus(driver);

        log.info("Business registration uploaded: driverId={}", driver.getId());

        return DriverResponse.from(driver);
    }

    @Transactional
    public DriverResponse uploadDriverLicense(Long userId, MultipartFile file) {
        Driver driver = getDriverByUserId(userId);

        String filePath = fileStorageService.storeFile(file, "driver-license");
        driver.setDriverLicenseImage(filePath);

        // 검증 상태 업데이트
        updateVerificationStatus(driver);

        log.info("Driver license uploaded: driverId={}", driver.getId());

        return DriverResponse.from(driver);
    }

    @Transactional(readOnly = true)
    public DriverResponse getProfile(Long userId) {
        Driver driver = getDriverByUserId(userId);
        return DriverResponse.from(driver);
    }

    @Transactional
    public DriverResponse updateLocation(Long userId, LocationUpdateRequest request) {
        Driver driver = getDriverByUserId(userId);

        driver.setLatitude(request.getLatitude());
        driver.setLongitude(request.getLongitude());
        driver.setLocationUpdatedAt(LocalDateTime.now());

        return DriverResponse.from(driver);
    }

    @Transactional
    public DriverResponse setActive(Long userId, boolean active) {
        Driver driver = getDriverByUserId(userId);

        if (active && driver.getVerificationStatus() != Driver.VerificationStatus.VERIFIED) {
            throw CustomException.badRequest("검증이 완료되지 않아 활동 상태로 변경할 수 없습니다");
        }

        driver.setIsActive(active);
        log.info("Driver active status changed: driverId={}, active={}", driver.getId(), active);

        return DriverResponse.from(driver);
    }

    @Transactional(readOnly = true)
    public List<DriverResponse> getPendingDrivers() {
        return driverRepository.findByVerificationStatus(Driver.VerificationStatus.PENDING)
                .stream()
                .map(DriverResponse::from)
                .toList();
    }

    @Transactional
    public DriverResponse approveDriver(Long driverId, Long adminId) {
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> CustomException.notFound("기사를 찾을 수 없습니다"));

        driver.setVerificationStatus(Driver.VerificationStatus.VERIFIED);
        driver.setApprovedAt(LocalDateTime.now());
        driver.setApprovedBy(adminId);

        // 사용자 상태도 APPROVED로 변경
        driver.getUser().setStatus(User.UserStatus.APPROVED);

        log.info("Driver approved: driverId={}, adminId={}", driverId, adminId);

        // 기사에게 승인 알림 전송
        notificationService.notifyDriverApproved(driver);

        return DriverResponse.from(driver);
    }

    @Transactional
    public DriverResponse rejectDriver(Long driverId, String reason) {
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> CustomException.notFound("기사를 찾을 수 없습니다"));

        driver.setVerificationStatus(Driver.VerificationStatus.REJECTED);
        driver.setVerificationMessage(reason);

        // 사용자 상태도 REJECTED로 변경
        driver.getUser().setStatus(User.UserStatus.REJECTED);

        log.info("Driver rejected: driverId={}, reason={}", driverId, reason);

        // 기사에게 거절 알림 전송
        notificationService.notifyDriverRejected(driver, reason);

        return DriverResponse.from(driver);
    }

    private Driver getDriverByUserId(Long userId) {
        return driverRepository.findByUserId(userId)
                .orElseThrow(() -> CustomException.notFound("기사 정보를 찾을 수 없습니다. 먼저 기사 등록을 해주세요."));
    }

    private void updateVerificationStatus(Driver driver) {
        // 사업자등록증과 운전면허증 모두 업로드 완료 시 검증 대기 상태로 변경
        if (driver.getBusinessRegistrationImage() != null &&
            driver.getDriverLicenseImage() != null &&
            driver.getVerificationStatus() == Driver.VerificationStatus.PENDING) {

            driver.setVerificationStatus(Driver.VerificationStatus.VERIFYING);
            driver.setVerificationMessage("서류 검토 중입니다");
        }
    }
}
