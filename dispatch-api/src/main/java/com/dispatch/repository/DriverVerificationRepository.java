package com.dispatch.repository;

import com.dispatch.entity.Driver;
import com.dispatch.entity.DriverVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DriverVerificationRepository extends JpaRepository<DriverVerification, Long> {

    List<DriverVerification> findByDriverOrderByCreatedAtDesc(Driver driver);

    List<DriverVerification> findByDriverIdOrderByCreatedAtDesc(Long driverId);

    @Query("SELECT dv FROM DriverVerification dv WHERE dv.driver.id = :driverId AND dv.verificationType = :type ORDER BY dv.createdAt DESC")
    List<DriverVerification> findByDriverIdAndType(
            @Param("driverId") Long driverId,
            @Param("type") DriverVerification.VerificationType type);

    @Query("SELECT dv FROM DriverVerification dv WHERE dv.driver.id = :driverId AND dv.verificationType = :type ORDER BY dv.createdAt DESC LIMIT 1")
    Optional<DriverVerification> findLatestByDriverIdAndType(
            @Param("driverId") Long driverId,
            @Param("type") DriverVerification.VerificationType type);

    @Query("""
        SELECT dv FROM DriverVerification dv
        WHERE dv.driver.id = :driverId
        AND dv.createdAt = (
            SELECT MAX(dv2.createdAt) FROM DriverVerification dv2
            WHERE dv2.driver.id = dv.driver.id AND dv2.verificationType = dv.verificationType
        )
        ORDER BY dv.verificationType
    """)
    List<DriverVerification> findLatestVerificationsByDriverId(@Param("driverId") Long driverId);
}
