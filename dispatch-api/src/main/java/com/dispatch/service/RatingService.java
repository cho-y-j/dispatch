package com.dispatch.service;

import com.dispatch.dto.rating.RatingRequest;
import com.dispatch.dto.rating.RatingResponse;
import com.dispatch.entity.*;
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
public class RatingService {

    private final DriverRatingRepository ratingRepository;
    private final DriverRepository driverRepository;
    private final DispatchMatchRepository dispatchMatchRepository;
    private final DispatchRequestRepository dispatchRequestRepository;
    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;

    /**
     * 기사 평가 등록
     */
    @Transactional
    public RatingResponse createRating(Long dispatchId, RatingRequest request, Long raterUserId) {
        // 배차 완료 여부 확인
        DispatchMatch match = dispatchMatchRepository.findByDispatchRequestId(dispatchId)
                .orElseThrow(() -> CustomException.notFound("매칭 정보를 찾을 수 없습니다"));

        if (match.getStatus() != DispatchMatch.MatchStatus.SIGNED &&
            match.getStatus() != DispatchMatch.MatchStatus.COMPLETED) {
            throw CustomException.badRequest("완료된 배차만 평가할 수 있습니다");
        }

        // 이미 평가했는지 확인
        if (ratingRepository.existsByDispatchId(dispatchId)) {
            throw CustomException.conflict("이미 평가한 배차입니다");
        }

        // 평가자 정보 확인
        User rater = userRepository.findById(raterUserId)
                .orElseThrow(() -> CustomException.notFound("사용자를 찾을 수 없습니다"));

        // 발주처 ID 확인
        DispatchRequest dispatchRequest = dispatchRequestRepository.findById(dispatchId)
                .orElseThrow(() -> CustomException.notFound("배차를 찾을 수 없습니다"));

        Long companyId = dispatchRequest.getCompany() != null ?
                dispatchRequest.getCompany().getId() : null;

        DriverRating rating = DriverRating.builder()
                .dispatchId(dispatchId)
                .driverId(match.getDriver().getId())
                .companyId(companyId)
                .raterUserId(raterUserId)
                .rating(request.getRating())
                .comment(request.getComment())
                .build();

        ratingRepository.save(rating);

        // 기사 평균 별점 업데이트
        updateDriverAverageRating(match.getDriver().getId());

        log.info("Rating created: dispatchId={}, driverId={}, rating={}",
                dispatchId, match.getDriver().getId(), request.getRating());

        return buildRatingResponse(rating);
    }

    /**
     * 기사별 평가 목록
     */
    @Transactional(readOnly = true)
    public List<RatingResponse> getRatingsByDriver(Long driverId) {
        return ratingRepository.findByDriverIdOrderByCreatedAtDesc(driverId)
                .stream()
                .map(this::buildRatingResponse)
                .toList();
    }

    /**
     * 발주처별 평가 목록
     */
    @Transactional(readOnly = true)
    public List<RatingResponse> getRatingsByCompany(Long companyId) {
        return ratingRepository.findByCompanyIdOrderByCreatedAtDesc(companyId)
                .stream()
                .map(this::buildRatingResponse)
                .toList();
    }

    /**
     * 배차별 평가 조회
     */
    @Transactional(readOnly = true)
    public RatingResponse getRatingByDispatch(Long dispatchId) {
        DriverRating rating = ratingRepository.findByDispatchId(dispatchId)
                .orElseThrow(() -> CustomException.notFound("평가를 찾을 수 없습니다"));
        return buildRatingResponse(rating);
    }

    /**
     * 기사 평균 별점 업데이트
     */
    private void updateDriverAverageRating(Long driverId) {
        Double avgRating = ratingRepository.getAverageRatingByDriverId(driverId);
        Integer totalRatings = ratingRepository.countByDriverId(driverId);

        driverRepository.findById(driverId).ifPresent(driver -> {
            driver.setAverageRating(avgRating != null ? avgRating : 0.0);
            driver.setTotalRatings(totalRatings != null ? totalRatings : 0);
        });
    }

    private RatingResponse buildRatingResponse(DriverRating rating) {
        RatingResponse response = RatingResponse.from(rating);

        // 기사 이름 조회
        driverRepository.findById(rating.getDriverId())
                .ifPresent(driver -> response.setDriverName(driver.getUser().getName()));

        // 발주처 이름 조회
        if (rating.getCompanyId() != null) {
            companyRepository.findById(rating.getCompanyId())
                    .ifPresent(company -> response.setCompanyName(company.getName()));
        }

        // 평가자 이름 조회
        userRepository.findById(rating.getRaterUserId())
                .ifPresent(user -> response.setRaterName(user.getName()));

        return response;
    }
}
