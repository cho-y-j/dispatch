package com.dispatch.repository;

import com.dispatch.entity.DeviceToken;
import com.dispatch.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeviceTokenRepository extends JpaRepository<DeviceToken, Long> {

    Optional<DeviceToken> findByToken(String token);

    List<DeviceToken> findByUserAndActiveTrue(User user);

    @Query("SELECT dt FROM DeviceToken dt WHERE dt.user.id = :userId AND dt.active = true")
    List<DeviceToken> findByUserIdAndActiveTrue(@Param("userId") Long userId);

    @Query("SELECT dt FROM DeviceToken dt WHERE dt.user.id IN :userIds AND dt.active = true")
    List<DeviceToken> findByUserIdInAndActiveTrue(@Param("userIds") List<Long> userIds);

    @Query("SELECT dt FROM DeviceToken dt WHERE dt.user.role = :role AND dt.active = true")
    List<DeviceToken> findByUserRoleAndActiveTrue(@Param("role") User.UserRole role);

    @Modifying
    @Query("UPDATE DeviceToken dt SET dt.active = false WHERE dt.token IN :tokens")
    void deactivateByTokens(@Param("tokens") List<String> tokens);

    @Modifying
    @Query("UPDATE DeviceToken dt SET dt.active = false WHERE dt.user.id = :userId")
    void deactivateByUserId(@Param("userId") Long userId);
}
