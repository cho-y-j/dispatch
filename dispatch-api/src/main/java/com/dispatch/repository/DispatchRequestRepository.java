package com.dispatch.repository;

import com.dispatch.entity.DispatchRequest;
import com.dispatch.entity.Equipment;
import com.dispatch.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface DispatchRequestRepository extends JpaRepository<DispatchRequest, Long> {

    List<DispatchRequest> findByStaff(User staff);

    List<DispatchRequest> findByStatus(DispatchRequest.DispatchStatus status);

    List<DispatchRequest> findByStatusAndEquipmentType(
            DispatchRequest.DispatchStatus status,
            Equipment.EquipmentType equipmentType);

    @Query("SELECT d FROM DispatchRequest d WHERE d.status = 'OPEN' AND d.workDate >= :today ORDER BY d.workDate, d.workTime")
    List<DispatchRequest> findAvailableDispatches(@Param("today") LocalDate today);

    @Query(value = """
        SELECT dr.* FROM dispatch_requests dr
        WHERE dr.status = 'OPEN'
        AND dr.work_date >= :today
        AND (6371 * acos(cos(radians(:lat)) * cos(radians(dr.latitude))
        * cos(radians(dr.longitude) - radians(:lng)) + sin(radians(:lat))
        * sin(radians(dr.latitude)))) <= :radius
        ORDER BY dr.work_date, dr.work_time
        """, nativeQuery = true)
    List<DispatchRequest> findNearbyAvailableDispatches(
            @Param("lat") Double latitude,
            @Param("lng") Double longitude,
            @Param("radius") Double radiusKm,
            @Param("today") LocalDate today);

    @Query("SELECT d FROM DispatchRequest d WHERE d.company.id = :companyId ORDER BY d.createdAt DESC")
    List<DispatchRequest> findByCompanyId(@Param("companyId") Long companyId);

    @Query("SELECT d FROM DispatchRequest d WHERE d.staff.id = :staffId ORDER BY d.createdAt DESC")
    List<DispatchRequest> findByStaffId(@Param("staffId") Long staffId);
}
