package com.dispatch.repository;

import com.dispatch.entity.Suspension;
import com.dispatch.entity.Warning;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SuspensionRepository extends JpaRepository<Suspension, Long> {

    List<Suspension> findByUserIdAndUserType(Long userId, Warning.UserType userType);

    @Query("SELECT s FROM Suspension s WHERE s.userId = :userId AND s.userType = :userType AND s.isActive = true")
    Optional<Suspension> findActiveSuspension(@Param("userId") Long userId, @Param("userType") Warning.UserType userType);

    @Query("SELECT s FROM Suspension s WHERE s.userId = :userId AND s.userType = :userType AND s.isActive = true AND (s.type = 'PERMANENT' OR s.endDate > :now)")
    Optional<Suspension> findCurrentActiveSuspension(@Param("userId") Long userId, @Param("userType") Warning.UserType userType, @Param("now") LocalDateTime now);

    boolean existsByUserIdAndUserTypeAndIsActiveTrue(Long userId, Warning.UserType userType);

    @Query("SELECT s FROM Suspension s WHERE s.isActive = true ORDER BY s.createdAt DESC")
    List<Suspension> findAllActiveSuspensions();

    @Query("SELECT s FROM Suspension s ORDER BY s.createdAt DESC")
    List<Suspension> findAllOrderByCreatedAtDesc();

    @Query("SELECT s FROM Suspension s WHERE s.isActive = true AND s.type = 'TEMP' AND s.endDate <= :now")
    List<Suspension> findExpiredSuspensions(@Param("now") LocalDateTime now);
}
