package com.dispatch.service;

import com.dispatch.dto.dispatch.DispatchCreateRequest;
import com.dispatch.dto.dispatch.DispatchResponse;
import com.dispatch.dto.dispatch.SignatureRequest;
import com.dispatch.dto.dispatch.WorkReportResponse;
import com.dispatch.entity.*;
import com.dispatch.exception.CustomException;
import com.dispatch.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class DispatchService {

    private final DispatchRequestRepository dispatchRequestRepository;
    private final DispatchMatchRepository dispatchMatchRepository;
    private final UserRepository userRepository;
    private final DriverRepository driverRepository;
    private final EquipmentRepository equipmentRepository;
    private final CompanyRepository companyRepository;
    private final NotificationService notificationService;
    private final PdfGenerationService pdfGenerationService;

    // ========== 직원용 API ==========

    @Transactional
    public DispatchResponse createDispatch(Long staffId, DispatchCreateRequest request) {
        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> CustomException.notFound("사용자를 찾을 수 없습니다"));

        // 사용자의 소속 회사 조회
        Company company = staff.getCompany();
        if (company == null) {
            company = companyRepository.findByEmployeesUserId(staffId).orElse(null);
        }

        DispatchRequest dispatch = DispatchRequest.builder()
                .staff(staff)
                .company(company)
                .siteAddress(request.getSiteAddress())
                .siteDetail(request.getSiteDetail())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .contactName(request.getContactName())
                .contactPhone(request.getContactPhone())
                .workDate(request.getWorkDate())
                .workTime(request.getWorkTime())
                .estimatedHours(request.getEstimatedHours())
                .workDescription(request.getWorkDescription())
                .equipmentType(request.getEquipmentType())
                .minHeight(request.getMinHeight())
                .equipmentRequirements(request.getEquipmentRequirements())
                .price(request.getPrice())
                .priceNegotiable(request.getPriceNegotiable() != null ? request.getPriceNegotiable() : false)
                .status(DispatchRequest.DispatchStatus.OPEN)
                .build();

        dispatchRequestRepository.save(dispatch);

        log.info("Dispatch created: id={}, staffId={}", dispatch.getId(), staffId);

        // 주변 기사들에게 실시간 알림 전송
        notificationService.notifyNewDispatch(dispatch);

        return DispatchResponse.from(dispatch);
    }

    @Transactional(readOnly = true)
    public List<DispatchResponse> getAllDispatches() {
        return dispatchRequestRepository.findAll().stream()
                .map(request -> {
                    DispatchMatch match = dispatchMatchRepository.findByRequest(request).orElse(null);
                    return DispatchResponse.from(request, match);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DispatchResponse> getMyDispatches(Long staffId) {
        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> CustomException.notFound("사용자를 찾을 수 없습니다"));

        return dispatchRequestRepository.findByStaff(staff).stream()
                .map(request -> {
                    DispatchMatch match = dispatchMatchRepository.findByRequest(request).orElse(null);
                    return DispatchResponse.from(request, match);
                })
                .toList();
    }

    // ========== 기사용 API ==========

    @Transactional(readOnly = true)
    public List<DispatchResponse> getAvailableDispatches(Long userId, Double latitude, Double longitude, Double radiusKm) {
        Driver driver = driverRepository.findByUserId(userId)
                .orElseThrow(() -> CustomException.notFound("기사 정보를 찾을 수 없습니다"));

        if (driver.getVerificationStatus() != Driver.VerificationStatus.VERIFIED) {
            throw CustomException.forbidden("검증이 완료되지 않아 배차 목록을 조회할 수 없습니다");
        }

        List<DispatchRequest> dispatches;

        if (latitude != null && longitude != null && radiusKm != null) {
            // 위치 기반 검색
            dispatches = dispatchRequestRepository.findNearbyAvailableDispatches(
                    latitude, longitude, radiusKm, LocalDate.now());
        } else {
            // 전체 조회
            dispatches = dispatchRequestRepository.findAvailableDispatches(LocalDate.now());
        }

        return dispatches.stream()
                .map(DispatchResponse::from)
                .toList();
    }

    @Transactional
    public DispatchResponse acceptDispatch(Long userId, Long dispatchId) {
        Driver driver = driverRepository.findByUserId(userId)
                .orElseThrow(() -> CustomException.notFound("기사 정보를 찾을 수 없습니다"));

        if (driver.getVerificationStatus() != Driver.VerificationStatus.VERIFIED) {
            throw CustomException.forbidden("검증이 완료되지 않아 배차를 수락할 수 없습니다");
        }

        DispatchRequest dispatch = dispatchRequestRepository.findById(dispatchId)
                .orElseThrow(() -> CustomException.notFound("배차를 찾을 수 없습니다"));

        if (dispatch.getStatus() != DispatchRequest.DispatchStatus.OPEN) {
            throw CustomException.conflict("이미 처리된 배차입니다");
        }

        // 기사의 장비 중 매칭되는 장비 찾기
        Equipment equipment = driver.getEquipments().stream()
                .filter(e -> e.getType() == dispatch.getEquipmentType())
                .filter(e -> e.getStatus() == Equipment.EquipmentStatus.ACTIVE)
                .findFirst()
                .orElseThrow(() -> CustomException.badRequest("해당 장비 타입을 보유하고 있지 않습니다"));

        // 매칭 생성
        DispatchMatch match = DispatchMatch.builder()
                .request(dispatch)
                .driver(driver)
                .equipment(equipment)
                .matchedAt(LocalDateTime.now())
                .status(DispatchMatch.MatchStatus.ACCEPTED)
                .build();

        dispatchMatchRepository.save(match);

        // 배차 상태 업데이트
        dispatch.setStatus(DispatchRequest.DispatchStatus.MATCHED);

        log.info("Dispatch accepted: dispatchId={}, driverId={}", dispatchId, driver.getId());

        // 직원에게 실시간 알림 전송
        notificationService.notifyDispatchAccepted(dispatch);

        return DispatchResponse.from(dispatch, match);
    }

    @Transactional
    public DispatchResponse departForSite(Long userId, Long dispatchId) {
        DispatchMatch match = getMatchForDriver(userId, dispatchId);

        if (match.getStatus() != DispatchMatch.MatchStatus.ACCEPTED) {
            throw CustomException.badRequest("출발 처리할 수 없는 상태입니다");
        }

        match.setStatus(DispatchMatch.MatchStatus.EN_ROUTE);
        match.setDepartedAt(LocalDateTime.now());

        log.info("Driver departed: dispatchId={}", dispatchId);

        return DispatchResponse.from(match.getRequest(), match);
    }

    @Transactional
    public DispatchResponse arriveAtSite(Long userId, Long dispatchId) {
        DispatchMatch match = getMatchForDriver(userId, dispatchId);

        if (match.getStatus() != DispatchMatch.MatchStatus.EN_ROUTE) {
            throw CustomException.badRequest("도착 처리할 수 없는 상태입니다");
        }

        match.setStatus(DispatchMatch.MatchStatus.ARRIVED);
        match.setArrivedAt(LocalDateTime.now());
        match.getRequest().setStatus(DispatchRequest.DispatchStatus.IN_PROGRESS);

        log.info("Driver arrived: dispatchId={}", dispatchId);

        // 직원에게 실시간 알림 전송
        notificationService.notifyDriverArrived(match.getRequest());

        return DispatchResponse.from(match.getRequest(), match);
    }

    @Transactional
    public DispatchResponse startWork(Long userId, Long dispatchId) {
        DispatchMatch match = getMatchForDriver(userId, dispatchId);

        if (match.getStatus() != DispatchMatch.MatchStatus.ARRIVED) {
            throw CustomException.badRequest("작업 시작 처리할 수 없는 상태입니다");
        }

        match.setStatus(DispatchMatch.MatchStatus.WORKING);
        match.setWorkStartedAt(LocalDateTime.now());

        log.info("Work started: dispatchId={}", dispatchId);

        return DispatchResponse.from(match.getRequest(), match);
    }

    @Transactional
    public DispatchResponse completeWork(Long userId, Long dispatchId) {
        DispatchMatch match = getMatchForDriver(userId, dispatchId);

        if (match.getStatus() != DispatchMatch.MatchStatus.WORKING) {
            throw CustomException.badRequest("작업 완료 처리할 수 없는 상태입니다");
        }

        match.setStatus(DispatchMatch.MatchStatus.COMPLETED);
        match.setCompletedAt(LocalDateTime.now());

        log.info("Work completed: dispatchId={}", dispatchId);

        return DispatchResponse.from(match.getRequest(), match);
    }

    @Transactional
    public DispatchResponse signByDriver(Long userId, Long dispatchId, SignatureRequest request) {
        DispatchMatch match = getMatchForDriver(userId, dispatchId);

        if (match.getStatus() != DispatchMatch.MatchStatus.COMPLETED) {
            throw CustomException.badRequest("서명할 수 없는 상태입니다");
        }

        match.setDriverSignature(request.getSignature());
        match.setDriverSignedAt(LocalDateTime.now());
        if (request.getFinalPrice() != null) {
            match.setFinalPrice(request.getFinalPrice());
        }
        if (request.getWorkNotes() != null) {
            match.setWorkNotes(request.getWorkNotes());
        }

        log.info("Driver signed: dispatchId={}", dispatchId);

        return DispatchResponse.from(match.getRequest(), match);
    }

    @Transactional
    public DispatchResponse signByClient(Long dispatchId, SignatureRequest request) {
        DispatchMatch match = dispatchMatchRepository.findByRequest(
                dispatchRequestRepository.findById(dispatchId)
                        .orElseThrow(() -> CustomException.notFound("배차를 찾을 수 없습니다"))
        ).orElseThrow(() -> CustomException.notFound("매칭 정보를 찾을 수 없습니다"));

        if (match.getDriverSignature() == null) {
            throw CustomException.badRequest("기사 서명이 먼저 필요합니다");
        }

        match.setClientSignature(request.getSignature());
        match.setClientName(request.getClientName());
        match.setClientSignedAt(LocalDateTime.now());
        match.setStatus(DispatchMatch.MatchStatus.SIGNED);
        match.getRequest().setStatus(DispatchRequest.DispatchStatus.COMPLETED);

        log.info("Client signed, dispatch completed: dispatchId={}", dispatchId);

        // 직원에게 완료 알림 전송
        notificationService.notifyDispatchCompleted(match.getRequest());

        // 작업 확인서 PDF 생성
        try {
            String pdfUrl = pdfGenerationService.generateWorkReport(match);
            match.setWorkReportUrl(pdfUrl);
            log.info("Work report generated: dispatchId={}, url={}", dispatchId, pdfUrl);
        } catch (Exception e) {
            log.error("Failed to generate work report PDF: dispatchId={}, error={}", dispatchId, e.getMessage());
            // PDF 생성 실패해도 배차 완료 처리는 진행
        }

        return DispatchResponse.from(match.getRequest(), match);
    }

    /**
     * 발주처 확인/서명
     */
    @Transactional
    public DispatchResponse signByCompany(Long userId, Long dispatchId, SignatureRequest request) {
        DispatchRequest dispatch = dispatchRequestRepository.findById(dispatchId)
                .orElseThrow(() -> CustomException.notFound("배차를 찾을 수 없습니다"));

        // 권한 확인 - 해당 발주처 소속 직원인지
        if (!dispatch.getStaff().getId().equals(userId) &&
            !dispatch.getCompany().getEmployees().stream()
                .anyMatch(e -> e.getId().equals(userId))) {
            throw CustomException.forbidden("이 배차를 확인할 권한이 없습니다");
        }

        DispatchMatch match = dispatchMatchRepository.findByRequest(dispatch)
                .orElseThrow(() -> CustomException.notFound("매칭 정보를 찾을 수 없습니다"));

        if (match.getStatus() != DispatchMatch.MatchStatus.SIGNED) {
            throw CustomException.badRequest("현장 서명이 먼저 완료되어야 합니다");
        }

        // 발주처 서명/확인 처리
        if (request.getSignature() != null && !request.getSignature().isEmpty()) {
            match.setCompanySignature(request.getSignature());
        }
        match.setCompanySignedBy(request.getClientName()); // 서명자 이름
        match.setCompanySignedAt(LocalDateTime.now());
        match.setCompanyConfirmed(true);

        log.info("Company confirmed dispatch: dispatchId={}, confirmedBy={}", dispatchId, request.getClientName());

        return DispatchResponse.from(match.getRequest(), match);
    }

    /**
     * 작업 확인서 조회
     */
    @Transactional(readOnly = true)
    public WorkReportResponse getWorkReport(Long dispatchId) {
        DispatchRequest dispatch = dispatchRequestRepository.findById(dispatchId)
                .orElseThrow(() -> CustomException.notFound("배차를 찾을 수 없습니다"));

        DispatchMatch match = dispatchMatchRepository.findByRequest(dispatch)
                .orElseThrow(() -> CustomException.notFound("매칭 정보를 찾을 수 없습니다"));

        return WorkReportResponse.from(dispatch, match);
    }

    /**
     * 완료된 배차 목록 (작업 확인서 목록)
     */
    @Transactional(readOnly = true)
    public List<WorkReportResponse> getCompletedDispatches() {
        return dispatchMatchRepository.findByStatusIn(
                List.of(DispatchMatch.MatchStatus.SIGNED)
        ).stream()
                .map(match -> WorkReportResponse.from(match.getRequest(), match))
                .toList();
    }

    /**
     * 발주처 완료 배차 목록
     */
    @Transactional(readOnly = true)
    public List<WorkReportResponse> getCompanyCompletedDispatches(Long userId) {
        // 사용자의 소속 회사 찾기
        Company company = companyRepository.findByEmployeesUserId(userId)
                .orElseThrow(() -> CustomException.notFound("소속 회사를 찾을 수 없습니다"));

        return dispatchRequestRepository.findByCompanyId(company.getId()).stream()
                .filter(d -> d.getStatus() == DispatchRequest.DispatchStatus.COMPLETED)
                .map(d -> {
                    DispatchMatch match = dispatchMatchRepository.findByRequest(d).orElse(null);
                    return WorkReportResponse.from(d, match);
                })
                .filter(r -> r != null)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DispatchResponse> getDriverDispatches(Long userId) {
        Driver driver = driverRepository.findByUserId(userId)
                .orElseThrow(() -> CustomException.notFound("기사 정보를 찾을 수 없습니다"));

        return dispatchMatchRepository.findByDriverOrderByMatchedAtDesc(driver).stream()
                .map(match -> DispatchResponse.from(match.getRequest(), match))
                .toList();
    }

    @Transactional(readOnly = true)
    public DispatchResponse getDispatchDetail(Long dispatchId) {
        DispatchRequest dispatch = dispatchRequestRepository.findById(dispatchId)
                .orElseThrow(() -> CustomException.notFound("배차를 찾을 수 없습니다"));

        DispatchMatch match = dispatchMatchRepository.findByRequest(dispatch).orElse(null);
        return DispatchResponse.from(dispatch, match);
    }

    @Transactional
    public DispatchResponse cancelDispatch(Long userId, Long dispatchId) {
        DispatchRequest dispatch = dispatchRequestRepository.findById(dispatchId)
                .orElseThrow(() -> CustomException.notFound("배차를 찾을 수 없습니다"));

        // 권한 확인 (직원 본인 또는 관리자)
        if (!dispatch.getStaff().getId().equals(userId)) {
            throw CustomException.forbidden("배차를 취소할 권한이 없습니다");
        }

        if (dispatch.getStatus() == DispatchRequest.DispatchStatus.COMPLETED) {
            throw CustomException.badRequest("완료된 배차는 취소할 수 없습니다");
        }

        dispatch.setStatus(DispatchRequest.DispatchStatus.CANCELLED);

        // 매칭이 있다면 취소 처리
        dispatchMatchRepository.findByRequest(dispatch).ifPresent(match -> {
            match.setStatus(DispatchMatch.MatchStatus.CANCELLED);
        });

        log.info("Dispatch cancelled: dispatchId={}", dispatchId);

        // 관련자들에게 취소 알림 전송
        notificationService.notifyDispatchCancelled(dispatch);

        return DispatchResponse.from(dispatch);
    }

    private DispatchMatch getMatchForDriver(Long userId, Long dispatchId) {
        Driver driver = driverRepository.findByUserId(userId)
                .orElseThrow(() -> CustomException.notFound("기사 정보를 찾을 수 없습니다"));

        DispatchRequest dispatch = dispatchRequestRepository.findById(dispatchId)
                .orElseThrow(() -> CustomException.notFound("배차를 찾을 수 없습니다"));

        DispatchMatch match = dispatchMatchRepository.findByRequest(dispatch)
                .orElseThrow(() -> CustomException.notFound("매칭 정보를 찾을 수 없습니다"));

        if (!match.getDriver().getId().equals(driver.getId())) {
            throw CustomException.forbidden("해당 배차에 대한 권한이 없습니다");
        }

        return match;
    }
}
