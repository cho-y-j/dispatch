package com.dispatch.repository;

import com.dispatch.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CompanyRepository extends JpaRepository<Company, Long> {

    Optional<Company> findByBusinessNumber(String businessNumber);

    boolean existsByBusinessNumber(String businessNumber);

    List<Company> findByStatus(Company.CompanyStatus status);

    List<Company> findByVerificationStatus(Company.VerificationStatus status);

    @Query("SELECT c FROM Company c WHERE c.status = :status ORDER BY c.createdAt DESC")
    List<Company> findByStatusOrderByCreatedAtDesc(@Param("status") Company.CompanyStatus status);

    @Query("SELECT c FROM Company c WHERE c.status = 'PENDING' ORDER BY c.createdAt ASC")
    List<Company> findPendingCompanies();

    @Query("SELECT c FROM Company c WHERE c.name LIKE %:keyword% OR c.businessNumber LIKE %:keyword%")
    List<Company> searchByKeyword(@Param("keyword") String keyword);

    @Query("SELECT c FROM Company c JOIN c.employees e WHERE e.id = :userId")
    Optional<Company> findByEmployeesUserId(@Param("userId") Long userId);
}
