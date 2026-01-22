package com.dispatch.service;

import com.dispatch.dto.verify.*;
import com.dispatch.entity.Driver;
import com.dispatch.entity.DriverVerification;
import com.dispatch.repository.DriverRepository;
import com.dispatch.repository.DriverVerificationRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;

@Slf4j
@Service
public class VerifyService {

    private final RestTemplate restTemplate;
    private final DriverVerificationRepository verificationRepository;
    private final DriverRepository driverRepository;
    private final ObjectMapper objectMapper;

    @Value("${verify.api.url:http://localhost:8080}")
    private String verifyApiUrl;

    @Value("${verify.api.key:}")
    private String verifyApiKey;

    public VerifyService(DriverVerificationRepository verificationRepository,
                         DriverRepository driverRepository) {
        this.restTemplate = new RestTemplate();
        this.verificationRepository = verificationRepository;
        this.driverRepository = driverRepository;
        this.objectMapper = new ObjectMapper();
    }

    /**
     * 화물운송 자격증 검증
     */
    public VerifyResponse verifyCargo(CargoVerifyRequest request) {
        log.info("Verifying cargo license: name={}, lcnsNo={}", request.getName(), request.getLcnsNo());

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            if (verifyApiKey != null && !verifyApiKey.isEmpty()) {
                headers.set("X-API-KEY", verifyApiKey);
            }

            HttpEntity<CargoVerifyRequest> entity = new HttpEntity<>(request, headers);

            String url = verifyApiUrl + "/verify/cargo";
            log.debug("Calling verify API: {}", url);

            ResponseEntity<VerifyResponse> response = restTemplate.postForEntity(
                    url,
                    entity,
                    VerifyResponse.class
            );

            VerifyResponse body = response.getBody();
            log.info("Cargo verification result: {}", body != null ? body.getResult() : "null");
            return body;

        } catch (RestClientException e) {
            log.error("Cargo verification failed: {}", e.getMessage());
            return VerifyResponse.error("자격증 검증 서버 연결 실패: " + e.getMessage());
        }
    }

    /**
     * KOSHA 교육이수증 검증 (이미지 업로드)
     */
    public VerifyResponse verifyKosha(MultipartFile image) {
        log.info("Verifying KOSHA certificate: filename={}, size={}",
                image.getOriginalFilename(), image.getSize());

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            if (verifyApiKey != null && !verifyApiKey.isEmpty()) {
                headers.set("X-API-KEY", verifyApiKey);
            }

            // MultipartFile을 ByteArrayResource로 변환
            ByteArrayResource fileResource = new ByteArrayResource(image.getBytes()) {
                @Override
                public String getFilename() {
                    return image.getOriginalFilename();
                }
            };

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("image", fileResource);

            HttpEntity<MultiValueMap<String, Object>> entity = new HttpEntity<>(body, headers);

            String url = verifyApiUrl + "/verify/kosha/upload";
            log.debug("Calling verify API: {}", url);

            ResponseEntity<VerifyResponse> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    VerifyResponse.class
            );

            VerifyResponse result = response.getBody();
            log.info("KOSHA verification result: {}", result != null ? result.getResult() : "null");
            return result;

        } catch (IOException e) {
            log.error("KOSHA verification failed - file read error: {}", e.getMessage());
            return VerifyResponse.error("파일 읽기 실패: " + e.getMessage());
        } catch (RestClientException e) {
            log.error("KOSHA verification failed: {}", e.getMessage());
            return VerifyResponse.error("검증 서버 연결 실패: " + e.getMessage());
        }
    }

    /**
     * 사업자등록번호 검증 (국세청 API - 미구현)
     *
     * 국세청 사업자등록상태 조회 API 연동 필요
     * https://www.data.go.kr/data/15081808/openapi.do
     */
    public VerifyResponse verifyBusinessRegistration(String businessNumber) {
        log.info("Verifying business registration: {}", businessNumber);

        // TODO: 국세청 API 연동 구현
        // 현재는 형식 검증만 수행
        if (businessNumber == null || !businessNumber.matches("\\d{10}")) {
            return VerifyResponse.builder()
                    .result(VerifyResponse.VerifyResult.INVALID)
                    .reasonCode("INVALID_FORMAT")
                    .message("사업자등록번호 형식이 올바르지 않습니다 (10자리 숫자)")
                    .build();
        }

        // 사업자등록번호 체크섬 검증
        if (!validateBusinessNumberChecksum(businessNumber)) {
            return VerifyResponse.builder()
                    .result(VerifyResponse.VerifyResult.INVALID)
                    .reasonCode("INVALID_CHECKSUM")
                    .message("사업자등록번호 체크섬이 올바르지 않습니다")
                    .build();
        }

        return VerifyResponse.builder()
                .result(VerifyResponse.VerifyResult.UNKNOWN)
                .reasonCode("NOT_IMPLEMENTED")
                .message("사업자등록상태 조회 API 연동 대기 중")
                .build();
    }

    /**
     * 운전면허 검증 (도로교통공단 API - 미구현)
     */
    public VerifyResponse verifyDriverLicense(String licenseNumber, String name, String birth) {
        log.info("Verifying driver license: {}", licenseNumber);

        // TODO: 도로교통공단 API 연동 구현
        return VerifyResponse.builder()
                .result(VerifyResponse.VerifyResult.UNKNOWN)
                .reasonCode("NOT_IMPLEMENTED")
                .message("운전면허 검증 API 연동 대기 중")
                .build();
    }

    /**
     * 사업자등록번호 체크섬 검증
     */
    private boolean validateBusinessNumberChecksum(String number) {
        if (number == null || number.length() != 10) {
            return false;
        }

        try {
            int[] weights = {1, 3, 7, 1, 3, 7, 1, 3, 5};
            int sum = 0;

            for (int i = 0; i < 9; i++) {
                sum += Character.getNumericValue(number.charAt(i)) * weights[i];
            }

            sum += (Character.getNumericValue(number.charAt(8)) * 5) / 10;

            int checkDigit = (10 - (sum % 10)) % 10;
            return checkDigit == Character.getNumericValue(number.charAt(9));

        } catch (Exception e) {
            return false;
        }
    }

    // ==================== 운전면허 검증 (RIMS API) ====================

    /**
     * 운전면허 검증 (RIMS API 연동)
     */
    public VerifyResponse verifyDriverLicenseRims(RimsLicenseRequest request) {
        log.info("Verifying driver license via RIMS: licenseNumber={}, name={}",
                request.getLicenseNumber(), request.getName());

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            if (verifyApiKey != null && !verifyApiKey.isEmpty()) {
                headers.set("X-API-KEY", verifyApiKey);
            }

            // verify-server의 RIMS API 형식에 맞게 변환
            Map<String, String> requestBody = new HashMap<>();
            requestBody.put("lcnsNo", request.getLicenseNumber());
            requestBody.put("name", request.getName());
            if (request.getBirth() != null) {
                requestBody.put("birth", request.getBirth());
            }
            if (request.getLicenseType() != null) {
                requestBody.put("lcnsTy", request.getLicenseType());
            }

            HttpEntity<Map<String, String>> entity = new HttpEntity<>(requestBody, headers);

            String url = verifyApiUrl + "/verify/rims/license";
            log.debug("Calling RIMS verify API: {}", url);

            ResponseEntity<VerifyResponse> response = restTemplate.postForEntity(
                    url,
                    entity,
                    VerifyResponse.class
            );

            VerifyResponse body = response.getBody();
            log.info("RIMS license verification result: {}", body != null ? body.getResult() : "null");
            return body;

        } catch (RestClientException e) {
            log.error("RIMS license verification failed: {}", e.getMessage());
            return VerifyResponse.error("운전면허 검증 서버 연결 실패: " + e.getMessage());
        }
    }

    // ==================== 사업자등록 검증 (NTS API) ====================

    /**
     * 사업자등록 검증 (국세청 API 연동)
     */
    public VerifyResponse verifyBusinessRegistrationNts(BizVerifyRequest request) {
        log.info("Verifying business registration via NTS: businessNumber={}", request.getBusinessNumber());

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            if (verifyApiKey != null && !verifyApiKey.isEmpty()) {
                headers.set("X-API-KEY", verifyApiKey);
            }

            HttpEntity<BizVerifyRequest> entity = new HttpEntity<>(request, headers);

            String url = verifyApiUrl + "/verify/biz";
            log.debug("Calling NTS verify API: {}", url);

            ResponseEntity<VerifyResponse> response = restTemplate.postForEntity(
                    url,
                    entity,
                    VerifyResponse.class
            );

            VerifyResponse body = response.getBody();
            log.info("NTS business verification result: {}", body != null ? body.getResult() : "null");
            return body;

        } catch (RestClientException e) {
            log.error("NTS business verification failed: {}", e.getMessage());
            return VerifyResponse.error("사업자등록 검증 서버 연결 실패: " + e.getMessage());
        }
    }

    // ==================== 검증 이력 관리 ====================

    /**
     * 검증 이력 저장
     */
    @Transactional
    public DriverVerification saveVerificationHistory(Long driverId, DriverVerification.VerificationType type,
                                                       VerifyResponse response, Long verifiedBy) {
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new RuntimeException("기사를 찾을 수 없습니다: " + driverId));

        String rawResponse = null;
        try {
            rawResponse = objectMapper.writeValueAsString(response);
        } catch (Exception e) {
            log.warn("Failed to serialize verify response: {}", e.getMessage());
        }

        DriverVerification verification = DriverVerification.builder()
                .driver(driver)
                .verificationType(type)
                .result(convertResult(response.getResult()))
                .reasonCode(response.getReasonCode())
                .message(response.getMessage())
                .rawResponse(rawResponse)
                .verifiedBy(verifiedBy)
                .build();

        return verificationRepository.save(verification);
    }

    /**
     * 기사별 검증 상태 요약 조회
     */
    @Transactional(readOnly = true)
    public DriverVerificationSummary getDriverVerificationSummary(Long driverId) {
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new RuntimeException("기사를 찾을 수 없습니다: " + driverId));

        List<DriverVerification> latestVerifications = verificationRepository.findLatestVerificationsByDriverId(driverId);

        Map<DriverVerification.VerificationType, DriverVerification> verificationMap = new HashMap<>();
        for (DriverVerification v : latestVerifications) {
            verificationMap.put(v.getVerificationType(), v);
        }

        return DriverVerificationSummary.builder()
                .driverId(driver.getId())
                .driverName(driver.getUser().getName())
                .phone(driver.getUser().getPhone())
                .email(driver.getUser().getEmail())
                .businessRegistrationNumber(driver.getBusinessRegistrationNumber())
                .driverLicenseNumber(driver.getDriverLicenseNumber())
                .licenseStatus(buildItemStatus(verificationMap.get(DriverVerification.VerificationType.LICENSE)))
                .businessStatus(buildItemStatus(verificationMap.get(DriverVerification.VerificationType.BUSINESS)))
                .koshaStatus(buildItemStatus(verificationMap.get(DriverVerification.VerificationType.KOSHA)))
                .cargoStatus(buildItemStatus(verificationMap.get(DriverVerification.VerificationType.CARGO)))
                .build();
    }

    /**
     * 기사 검증 이력 조회
     */
    @Transactional(readOnly = true)
    public List<DriverVerificationResponse> getVerificationHistory(Long driverId) {
        List<DriverVerification> verifications = verificationRepository.findByDriverIdOrderByCreatedAtDesc(driverId);
        return verifications.stream()
                .map(DriverVerificationResponse::from)
                .toList();
    }

    /**
     * 모든 기사의 검증 상태 요약 조회
     */
    @Transactional(readOnly = true)
    public List<DriverVerificationSummary> getAllDriverVerificationSummaries() {
        List<Driver> drivers = driverRepository.findAll();
        List<DriverVerificationSummary> summaries = new ArrayList<>();

        for (Driver driver : drivers) {
            try {
                DriverVerificationSummary summary = getDriverVerificationSummary(driver.getId());
                summaries.add(summary);
            } catch (Exception e) {
                log.warn("Failed to get verification summary for driver {}: {}", driver.getId(), e.getMessage());
            }
        }

        return summaries;
    }

    private DriverVerificationSummary.VerificationItemStatus buildItemStatus(DriverVerification verification) {
        if (verification == null) {
            return DriverVerificationSummary.VerificationItemStatus.builder()
                    .result("NOT_VERIFIED")
                    .build();
        }

        return DriverVerificationSummary.VerificationItemStatus.builder()
                .result(verification.getResult().name())
                .reasonCode(verification.getReasonCode())
                .message(verification.getMessage())
                .verifiedAt(verification.getCreatedAt())
                .build();
    }

    private DriverVerification.VerifyResult convertResult(VerifyResponse.VerifyResult result) {
        if (result == null) {
            return DriverVerification.VerifyResult.UNKNOWN;
        }
        return switch (result) {
            case VALID -> DriverVerification.VerifyResult.VALID;
            case INVALID -> DriverVerification.VerifyResult.INVALID;
            case UNKNOWN -> DriverVerification.VerifyResult.UNKNOWN;
        };
    }
}
