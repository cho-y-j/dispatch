package com.dispatch.dto.fcm;

import com.dispatch.entity.DeviceToken;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeviceTokenRequest {

    @NotBlank(message = "FCM 토큰은 필수입니다")
    private String token;

    @NotNull(message = "디바이스 타입은 필수입니다")
    private DeviceToken.DeviceType deviceType;
}
