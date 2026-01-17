package com.dispatch.repository;

import com.dispatch.entity.DriverRating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DriverRatingRepository extends JpaRepository<DriverRating, Long> {

    List<DriverRating> findByDriverIdOrderByCreatedAtDesc(Long driverId);

    List<DriverRating> findByCompanyIdOrderByCreatedAtDesc(Long companyId);

    Optional<DriverRating> findByDispatchId(Long dispatchId);

    boolean existsByDispatchId(Long dispatchId);

    @Query("SELECT AVG(r.rating) FROM DriverRating r WHERE r.driverId = :driverId")
    Double getAverageRatingByDriverId(@Param("driverId") Long driverId);

    @Query("SELECT COUNT(r) FROM DriverRating r WHERE r.driverId = :driverId")
    Integer countByDriverId(@Param("driverId") Long driverId);

    @Query("SELECT r FROM DriverRating r WHERE r.driverId = :driverId ORDER BY r.createdAt DESC")
    List<DriverRating> findRecentRatingsByDriverId(@Param("driverId") Long driverId);
}
