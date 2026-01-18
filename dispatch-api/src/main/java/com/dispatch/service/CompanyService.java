package com.dispatch.service;

import com.dispatch.dto.company.CompanyCreateRequest;
import com.dispatch.dto.company.CompanyRegisterRequest;
import com.dispatch.dto.company.CompanyResponse;
import com.dispatch.dto.company.CompanyUpdateRequest;
import com.dispatch.dto.verify.VerifyResponse;
import com.dispatch.entity.Company;
import com.dispatch.entity.User;
import com.dispatch.exception.CustomException;
import com.dispatch.repository.CompanyRepository;
import com.dispatch.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final VerifyService verifyService;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;

    /**
     * 발주처 직접 회원가입
     */
    @Transactional
    public CompanyResponse register(CompanyRegisterRequest request, Long currentUserId) {
        // 사업자번호 중복 체크
        if (companyRepository.existsByBusinessNumber(request.getBusinessNumber())) {
            throw CustomException.conflict("이미 등록된 사업자번호입니다");
        }

        // 사업자등록번호 검증
        String verificationMessage = null;
        Company.VerificationStatus verificationStatus = Company.VerificationStatus.PENDING;

        VerifyResponse verifyResult = verifyService.verifyBusinessRegistration(
                request.getBusinessNumber().replaceAll("-", ""));

        if (verifyResult.getResult() == VerifyResponse.VerifyResult.INVALID) {
            verificationMessage = "사업자등록번호 검증 실패: " + verifyResult.getMessage();
            log.warn("Business registration verification failed: {}", verificationMessage);
        } else if (verifyResult.getResult() == VerifyResponse.VerifyResult.VALID) {
            verificationMessage = "사업자등록번호 검증 완료";
            verificationStatus = Company.VerificationStatus.VERIFIED;
        }

        // 회사 생성
        Company company = Company.builder()
                .name(request.getName())
                .businessNumber(request.getBusinessNumber())
                .representative(request.getRepresentative())
                .address(request.getAddress())
                .phone(request.getPhone())
                .contactName(request.getContactName())
                .contactEmail(request.getContactEmail())
                .contactPhone(request.getContactPhone())
                .status(Company.CompanyStatus.PENDING)
                .verificationStatus(verificationStatus)
                .verificationMessage(verificationMessage)
                .warningCount(0)
                .build();

        companyRepository.save(company);

        // 현재 로그인한 사용자가 있으면 회사에 연결
        if (currentUserId != null) {
            User currentUser = userRepository.findById(currentUserId)
                    .orElse(null);
            if (currentUser != null && currentUser.getCompany() == null) {
                currentUser.setCompany(company);
                company.getEmployees().add(currentUser);
                log.info("Current user linked to company: userId={}, companyId={}", currentUserId, company.getId());
            }
        }

        // contactEmail이 현재 사용자와 다른 경우에만 새 사용자 계정 생성
        User currentUser = currentUserId != null ? userRepository.findById(currentUserId).orElse(null) : null;
        boolean needNewUser = currentUser == null || !currentUser.getEmail().equals(request.getContactEmail());

        if (needNewUser && !userRepository.existsByEmail(request.getContactEmail())) {
            User newUser = User.builder()
                    .email(request.getContactEmail())
                    .password(passwordEncoder.encode(request.getPassword()))
                    .name(request.getContactName())
                    .phone(request.getContactPhone())
                    .role(User.UserRole.COMPANY)
                    .status(User.UserStatus.PENDING)
                    .company(company)
                    .build();

            userRepository.save(newUser);
            company.getEmployees().add(newUser);
        }

        log.info("Company registered: companyId={}, name={}", company.getId(), company.getName());

        return CompanyResponse.from(company);
    }

    /**
     * 관리자가 발주처 생성
     */
    @Transactional
    public CompanyResponse createByAdmin(CompanyCreateRequest request, Long adminId) {
        // 사업자번호 중복 체크
        if (companyRepository.existsByBusinessNumber(request.getBusinessNumber())) {
            throw CustomException.conflict("이미 등록된 사업자번호입니다");
        }

        // 이메일 중복 체크
        if (userRepository.existsByEmail(request.getContactEmail())) {
            throw CustomException.conflict("이미 사용 중인 이메일입니다");
        }

        // 회사 생성 (관리자 생성이므로 바로 승인)
        Company company = Company.builder()
                .name(request.getName())
                .businessNumber(request.getBusinessNumber())
                .representative(request.getRepresentative())
                .address(request.getAddress())
                .phone(request.getPhone())
                .contactName(request.getContactName())
                .contactEmail(request.getContactEmail())
                .contactPhone(request.getContactPhone())
                .status(Company.CompanyStatus.APPROVED)
                .verificationStatus(Company.VerificationStatus.VERIFIED)
                .verificationMessage("관리자 직접 생성")
                .warningCount(0)
                .approvedAt(LocalDateTime.now())
                .approvedBy(adminId)
                .build();

        companyRepository.save(company);

        // 담당자 사용자 계정 생성
        String password = request.getPassword() != null ? request.getPassword() : generateRandomPassword();

        User user = User.builder()
                .email(request.getContactEmail())
                .password(passwordEncoder.encode(password))
                .name(request.getContactName())
                .phone(request.getContactPhone())
                .role(User.UserRole.COMPANY)
                .status(User.UserStatus.APPROVED)
                .company(company)
                .build();

        userRepository.save(user);
        company.getEmployees().add(user);

        log.info("Company created by admin: companyId={}, adminId={}", company.getId(), adminId);

        return CompanyResponse.from(company);
    }

    /**
     * 발주처 목록 조회
     */
    @Transactional(readOnly = true)
    public List<CompanyResponse> getAllCompanies() {
        return companyRepository.findAll()
                .stream()
                .map(CompanyResponse::from)
                .toList();
    }

    /**
     * 승인 대기 발주처 목록
     */
    @Transactional(readOnly = true)
    public List<CompanyResponse> getPendingCompanies() {
        return companyRepository.findPendingCompanies()
                .stream()
                .map(CompanyResponse::from)
                .toList();
    }

    /**
     * 발주처 상세 조회
     */
    @Transactional(readOnly = true)
    public CompanyResponse getCompany(Long companyId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> CustomException.notFound("발주처를 찾을 수 없습니다"));
        return CompanyResponse.from(company);
    }

    /**
     * 발주처 정보 수정
     */
    @Transactional
    public CompanyResponse updateCompany(Long companyId, CompanyUpdateRequest request) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> CustomException.notFound("발주처를 찾을 수 없습니다"));

        if (request.getName() != null) {
            company.setName(request.getName());
        }
        if (request.getRepresentative() != null) {
            company.setRepresentative(request.getRepresentative());
        }
        if (request.getAddress() != null) {
            company.setAddress(request.getAddress());
        }
        if (request.getPhone() != null) {
            company.setPhone(request.getPhone());
        }
        if (request.getContactName() != null) {
            company.setContactName(request.getContactName());
        }
        if (request.getContactEmail() != null) {
            company.setContactEmail(request.getContactEmail());
        }
        if (request.getContactPhone() != null) {
            company.setContactPhone(request.getContactPhone());
        }

        log.info("Company updated: companyId={}", companyId);

        return CompanyResponse.from(company);
    }

    /**
     * 발주처 승인
     */
    @Transactional
    public CompanyResponse approveCompany(Long companyId, Long adminId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> CustomException.notFound("발주처를 찾을 수 없습니다"));

        company.setStatus(Company.CompanyStatus.APPROVED);
        company.setApprovedAt(LocalDateTime.now());
        company.setApprovedBy(adminId);

        // 소속 직원들의 상태도 APPROVED로 변경
        company.getEmployees().forEach(user -> user.setStatus(User.UserStatus.APPROVED));

        log.info("Company approved: companyId={}, adminId={}", companyId, adminId);

        return CompanyResponse.from(company);
    }

    /**
     * 발주처 거절
     */
    @Transactional
    public CompanyResponse rejectCompany(Long companyId, String reason) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> CustomException.notFound("발주처를 찾을 수 없습니다"));

        company.setVerificationStatus(Company.VerificationStatus.REJECTED);
        company.setVerificationMessage(reason);

        // 소속 직원들의 상태도 REJECTED로 변경
        company.getEmployees().forEach(user -> user.setStatus(User.UserStatus.REJECTED));

        log.info("Company rejected: companyId={}, reason={}", companyId, reason);

        return CompanyResponse.from(company);
    }

    /**
     * 사업자등록증 업로드
     */
    @Transactional
    public CompanyResponse uploadBusinessLicense(Long companyId, MultipartFile file) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> CustomException.notFound("발주처를 찾을 수 없습니다"));

        String filePath = fileStorageService.storeFile(file, "business-license");
        company.setBusinessLicenseImage(filePath);

        // 검증 상태 업데이트
        if (company.getVerificationStatus() == Company.VerificationStatus.PENDING) {
            company.setVerificationStatus(Company.VerificationStatus.VERIFYING);
            company.setVerificationMessage("서류 검토 중입니다");
        }

        log.info("Business license uploaded: companyId={}", companyId);

        return CompanyResponse.from(company);
    }

    /**
     * 발주처 삭제 (퇴장)
     */
    @Transactional
    public void deleteCompany(Long companyId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> CustomException.notFound("발주처를 찾을 수 없습니다"));

        company.setStatus(Company.CompanyStatus.BANNED);

        // 소속 직원들의 상태도 SUSPENDED로 변경
        company.getEmployees().forEach(user -> user.setStatus(User.UserStatus.SUSPENDED));

        log.info("Company banned: companyId={}", companyId);
    }

    /**
     * 사용자의 소속 발주처 조회
     */
    @Transactional(readOnly = true)
    public CompanyResponse getMyCompany(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> CustomException.notFound("사용자를 찾을 수 없습니다"));

        if (user.getCompany() == null) {
            throw CustomException.notFound("소속된 발주처가 없습니다");
        }

        return CompanyResponse.from(user.getCompany());
    }

    /**
     * 발주처 검색
     */
    @Transactional(readOnly = true)
    public List<CompanyResponse> searchCompanies(String keyword) {
        return companyRepository.searchByKeyword(keyword)
                .stream()
                .map(CompanyResponse::from)
                .toList();
    }

    private String generateRandomPassword() {
        return java.util.UUID.randomUUID().toString().substring(0, 8);
    }
}
