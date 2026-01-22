package com.dispatch.config;

import com.dispatch.entity.Driver;
import com.dispatch.entity.User;
import com.dispatch.repository.DriverRepository;
import com.dispatch.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class DataInitializer {

    private final PasswordEncoder passwordEncoder;

    @Bean
    @Profile({"dev", "docker"})
    CommandLineRunner initData(UserRepository userRepository, DriverRepository driverRepository) {
        return args -> {
            // 관리자 계정이 없으면 생성
            if (!userRepository.existsByEmail("admin@dispatch.com")) {
                User admin = User.builder()
                        .email("admin@dispatch.com")
                        .password(passwordEncoder.encode("admin123"))
                        .name("관리자")
                        .phone("010-0000-0000")
                        .role(User.UserRole.ADMIN)
                        .status(User.UserStatus.APPROVED)
                        .build();

                userRepository.save(admin);
                log.info("===========================================");
                log.info("Admin user created:");
                log.info("  Email: admin@dispatch.com");
                log.info("  Password: admin123");
                log.info("===========================================");
            }

            // 테스트용 직원 계정
            if (!userRepository.existsByEmail("staff@dispatch.com")) {
                User staff = User.builder()
                        .email("staff@dispatch.com")
                        .password(passwordEncoder.encode("staff123"))
                        .name("직원")
                        .phone("010-1111-1111")
                        .role(User.UserRole.STAFF)
                        .status(User.UserStatus.APPROVED)
                        .build();

                userRepository.save(staff);
                log.info("Staff user created: staff@dispatch.com / staff123");
            }

            // 테스트용 기사 계정 1
            if (!userRepository.existsByEmail("driver1@dispatch.com")) {
                User driverUser1 = User.builder()
                        .email("driver1@dispatch.com")
                        .password(passwordEncoder.encode("driver123"))
                        .name("김기사")
                        .phone("010-2222-2222")
                        .role(User.UserRole.DRIVER)
                        .status(User.UserStatus.APPROVED)
                        .build();
                userRepository.save(driverUser1);

                Driver driver1 = Driver.builder()
                        .user(driverUser1)
                        .businessRegistrationNumber("1234567890")
                        .businessName("김기사 운송")
                        .driverLicenseNumber("12-34-567890-12")
                        .verificationStatus(Driver.VerificationStatus.VERIFIED)
                        .isActive(true)
                        .grade(Driver.DriverGrade.GRADE_2)
                        .approvedAt(LocalDateTime.now())
                        .build();
                driverRepository.save(driver1);

                log.info("Driver 1 created: driver1@dispatch.com / driver123");
            }

            // 테스트용 기사 계정 2
            if (!userRepository.existsByEmail("driver2@dispatch.com")) {
                User driverUser2 = User.builder()
                        .email("driver2@dispatch.com")
                        .password(passwordEncoder.encode("driver123"))
                        .name("이기사")
                        .phone("010-3333-3333")
                        .role(User.UserRole.DRIVER)
                        .status(User.UserStatus.APPROVED)
                        .build();
                userRepository.save(driverUser2);

                Driver driver2 = Driver.builder()
                        .user(driverUser2)
                        .businessRegistrationNumber("9876543210")
                        .businessName("이기사 중장비")
                        .driverLicenseNumber("98-76-543210-98")
                        .verificationStatus(Driver.VerificationStatus.PENDING)
                        .isActive(true)
                        .grade(Driver.DriverGrade.GRADE_3)
                        .build();
                driverRepository.save(driver2);

                log.info("Driver 2 created: driver2@dispatch.com / driver123");
            }

            // 테스트용 기사 계정 3
            if (!userRepository.existsByEmail("driver3@dispatch.com")) {
                User driverUser3 = User.builder()
                        .email("driver3@dispatch.com")
                        .password(passwordEncoder.encode("driver123"))
                        .name("박기사")
                        .phone("010-4444-4444")
                        .role(User.UserRole.DRIVER)
                        .status(User.UserStatus.APPROVED)
                        .build();
                userRepository.save(driverUser3);

                Driver driver3 = Driver.builder()
                        .user(driverUser3)
                        .businessRegistrationNumber("5555666677")
                        .businessName("박기사 크레인")
                        .driverLicenseNumber("55-66-777788-99")
                        .verificationStatus(Driver.VerificationStatus.VERIFIED)
                        .isActive(false)
                        .grade(Driver.DriverGrade.GRADE_1)
                        .approvedAt(LocalDateTime.now())
                        .build();
                driverRepository.save(driver3);

                log.info("Driver 3 created: driver3@dispatch.com / driver123");
            }
        };
    }
}
