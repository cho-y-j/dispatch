package com.dispatch.dto.settings;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemSettingRequest {

    @NotBlank(message = "설정 값은 필수입니다")
    private String settingValue;

    private String description;
}
