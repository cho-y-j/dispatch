package com.dispatch.repository;

import com.dispatch.entity.Driver;
import com.dispatch.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DriverRepository extends JpaRepository<Driver, Long> {
    Optional<Driver> findByUser(User user);
    Optional<Driver> findByUserId(Long userId);

    @Query("SELECT d FROM Driver d WHERE d.user.email = :email")
    Optional<Driver> findByUserEmail(@Param("email") String email);

    List<Driver> findByVerificationStatus(Driver.VerificationStatus status);

    @Query("SELECT d FROM Driver d WHERE d.isActive = true AND d.verificationStatus = 'VERIFIED'")
    List<Driver> findActiveDrivers();

    @Query(value = """
        SELECT d.* FROM drivers d
        WHERE d.is_active = true
        AND d.verification_status = 'VERIFIED'
        AND (6371 * acos(cos(radians(:lat)) * cos(radians(d.latitude))
        * cos(radians(d.longitude) - radians(:lng)) + sin(radians(:lat))
        * sin(radians(d.latitude)))) <= :radius
        ORDER BY (6371 * acos(cos(radians(:lat)) * cos(radians(d.latitude))
        * cos(radians(d.longitude) - radians(:lng)) + sin(radians(:lat))
        * sin(radians(d.latitude))))
        """, nativeQuery = true)
    List<Driver> findNearbyDrivers(@Param("lat") Double latitude,
                                   @Param("lng") Double longitude,
                                   @Param("radius") Double radiusKm);
}
