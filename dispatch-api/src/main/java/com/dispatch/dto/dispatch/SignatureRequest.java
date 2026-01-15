package com.dispatch.dto.dispatch;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SignatureRequest {

    @NotBlank(message = "서명 데이터는 필수입니다")
    private String signature;  // Base64 encoded signature image

    private String clientName;

    private BigDecimal finalPrice;

    private String workNotes;
}
