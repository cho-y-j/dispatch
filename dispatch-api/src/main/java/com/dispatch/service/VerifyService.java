package com.dispatch.service;

import com.dispatch.dto.verify.CargoVerifyRequest;
import com.dispatch.dto.verify.VerifyResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Slf4j
@Service
public class VerifyService {

    private final RestTemplate restTemplate;

    @Value("${verify.api.url:http://localhost:8080}")
    private String verifyApiUrl;

    @Value("${verify.api.key:}")
    private String verifyApiKey;

    public VerifyService() {
        this.restTemplate = new RestTemplate();
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

            String url = verifyApiUrl + "/api/verify/cargo";
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

            String url = verifyApiUrl + "/api/verify/kosha";
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
}
