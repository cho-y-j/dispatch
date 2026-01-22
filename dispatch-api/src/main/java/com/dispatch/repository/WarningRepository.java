package com.dispatch.repository;

import com.dispatch.entity.Warning;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WarningRepository extends JpaRepository<Warning, Long> {

    List<Warning> findByUserIdAndUserTypeOrderByCreatedAtDesc(Long userId, Warning.UserType userType);

    List<Warning> findByUserIdAndUserType(Long userId, Warning.UserType userType);

    int countByUserIdAndUserType(Long userId, Warning.UserType userType);

    List<Warning> findByDispatchId(Long dispatchId);

    @Query("SELECT w FROM Warning w WHERE w.userType = :userType ORDER BY w.createdAt DESC")
    List<Warning> findAllByUserType(@Param("userType") Warning.UserType userType);

    @Query("SELECT w FROM Warning w ORDER BY w.createdAt DESC")
    List<Warning> findAllOrderByCreatedAtDesc();
}
