package com.dispatch.repository;

import com.dispatch.entity.DriverGradeHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DriverGradeHistoryRepository extends JpaRepository<DriverGradeHistory, Long> {

    List<DriverGradeHistory> findByDriverIdOrderByChangedAtDesc(Long driverId);

    @Query("SELECT h FROM DriverGradeHistory h WHERE h.driverId = :driverId ORDER BY h.changedAt DESC LIMIT 1")
    DriverGradeHistory findLatestByDriverId(@Param("driverId") Long driverId);
}
