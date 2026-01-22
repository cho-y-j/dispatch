package com.dispatch.dto.verify;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class VerifyResponse {

    private String requestId;
    private VerifyResult result;
    private String reasonCode;
    private String provider;
    private String verifiedAt;
    private String message;
    private Object raw;

    public enum VerifyResult {
        VALID,
        INVALID,
        UNKNOWN
    }

    public boolean isValid() {
        return result == VerifyResult.VALID;
    }

    public static VerifyResponse error(String message) {
        return VerifyResponse.builder()
                .result(VerifyResult.UNKNOWN)
                .reasonCode("ERROR")
                .message(message)
                .build();
    }
}
