package com.dispatch.service;

import com.dispatch.dto.auth.AuthResponse;
import com.dispatch.dto.auth.LoginRequest;
import com.dispatch.dto.auth.RegisterRequest;
import com.dispatch.entity.Driver;
import com.dispatch.entity.User;
import com.dispatch.exception.CustomException;
import com.dispatch.repository.DriverRepository;
import com.dispatch.repository.UserRepository;
import com.dispatch.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final DriverRepository driverRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // 이메일 중복 확인
        if (userRepository.existsByEmail(request.getEmail())) {
            throw CustomException.conflict("이미 등록된 이메일입니다");
        }

        // 전화번호 중복 확인
        if (userRepository.existsByPhone(request.getPhone())) {
            throw CustomException.conflict("이미 등록된 전화번호입니다");
        }

        // 역할 기본값 설정
        User.UserRole role = request.getRole() != null ? request.getRole() : User.UserRole.DRIVER;

        // 사용자 상태 설정 (기사는 승인 대기, 직원/관리자는 바로 승인)
        User.UserStatus status = (role == User.UserRole.DRIVER)
                ? User.UserStatus.PENDING
                : User.UserStatus.APPROVED;

        // 사용자 생성
        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .phone(request.getPhone().replaceAll("-", ""))
                .role(role)
                .status(status)
                .build();

        userRepository.save(user);

        // DRIVER 역할인 경우 Driver 엔티티도 생성
        if (role == User.UserRole.DRIVER) {
            Driver driver = Driver.builder()
                    .user(user)
                    .verificationStatus(Driver.VerificationStatus.PENDING)
                    .grade(Driver.DriverGrade.GRADE_3)
                    .isActive(false)
                    .build();
            driverRepository.save(driver);
            log.info("Driver entity created for user: {}", user.getEmail());
        }

        log.info("New user registered: {} ({})", user.getEmail(), user.getRole());

        // 토큰 발급
        String accessToken = jwtTokenProvider.createToken(user.getEmail(), user.getRole().name());
        String refreshToken = jwtTokenProvider.createRefreshToken(user.getEmail());

        return AuthResponse.of(accessToken, refreshToken, user);
    }

    public AuthResponse login(LoginRequest request) {
        // 인증
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        // 사용자 조회
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> CustomException.notFound("사용자를 찾을 수 없습니다"));

        // 토큰 발급
        String accessToken = jwtTokenProvider.createToken(user.getEmail(), user.getRole().name());
        String refreshToken = jwtTokenProvider.createRefreshToken(user.getEmail());

        log.info("User logged in: {}", user.getEmail());

        return AuthResponse.of(accessToken, refreshToken, user);
    }

    public AuthResponse refresh(String refreshToken) {
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw CustomException.unauthorized("유효하지 않은 리프레시 토큰입니다");
        }

        String email = jwtTokenProvider.getEmail(refreshToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> CustomException.notFound("사용자를 찾을 수 없습니다"));

        String newAccessToken = jwtTokenProvider.createToken(user.getEmail(), user.getRole().name());
        String newRefreshToken = jwtTokenProvider.createRefreshToken(user.getEmail());

        return AuthResponse.of(newAccessToken, newRefreshToken, user);
    }

    @Transactional(readOnly = true)
    public AuthResponse.UserInfo getCurrentUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> CustomException.notFound("사용자를 찾을 수 없습니다"));

        return AuthResponse.UserInfo.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .phone(user.getPhone())
                .role(user.getRole())
                .status(user.getStatus())
                .build();
    }
}
