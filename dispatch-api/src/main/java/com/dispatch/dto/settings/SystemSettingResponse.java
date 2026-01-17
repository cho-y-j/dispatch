package com.dispatch.dto.settings;

import com.dispatch.entity.SystemSetting;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemSettingResponse {

    private Long id;
    private String settingKey;
    private String settingValue;
    private String description;
    private Long updatedBy;
    private LocalDateTime updatedAt;

    public static SystemSettingResponse from(SystemSetting setting) {
        return SystemSettingResponse.builder()
                .id(setting.getId())
                .settingKey(setting.getSettingKey())
                .settingValue(setting.getSettingValue())
                .description(setting.getDescription())
                .updatedBy(setting.getUpdatedBy())
                .updatedAt(setting.getUpdatedAt())
                .build();
    }
}
