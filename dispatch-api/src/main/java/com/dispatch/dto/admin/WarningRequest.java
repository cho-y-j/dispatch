package com.dispatch.dto.admin;

import com.dispatch.entity.Warning;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarningRequest {

    @NotNull(message = "사용자 ID는 필수입니다")
    private Long userId;

    @NotNull(message = "사용자 유형은 필수입니다")
    private Warning.UserType userType;

    @NotNull(message = "경고 유형은 필수입니다")
    private Warning.WarningType type;

    @NotBlank(message = "경고 사유는 필수입니다")
    private String reason;

    private Long dispatchId;
}
