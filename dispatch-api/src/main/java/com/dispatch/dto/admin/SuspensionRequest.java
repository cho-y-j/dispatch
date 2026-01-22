package com.dispatch.dto.admin;

import com.dispatch.entity.Suspension;
import com.dispatch.entity.Warning;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SuspensionRequest {

    @NotNull(message = "사용자 ID는 필수입니다")
    private Long userId;

    @NotNull(message = "사용자 유형은 필수입니다")
    private Warning.UserType userType;

    @NotNull(message = "정지 유형은 필수입니다")
    private Suspension.SuspensionType type;

    @NotBlank(message = "정지 사유는 필수입니다")
    private String reason;

    // 임시 정지인 경우 종료일
    private LocalDateTime endDate;

    // 정지 기간 (일 수) - endDate 대신 사용 가능
    private Integer days;
}
