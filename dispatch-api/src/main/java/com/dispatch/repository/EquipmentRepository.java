package com.dispatch.repository;

import com.dispatch.entity.Driver;
import com.dispatch.entity.Equipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EquipmentRepository extends JpaRepository<Equipment, Long> {
    List<Equipment> findByDriver(Driver driver);
    List<Equipment> findByDriverId(Long driverId);
    List<Equipment> findByType(Equipment.EquipmentType type);
    List<Equipment> findByDriverAndStatus(Driver driver, Equipment.EquipmentStatus status);
}
