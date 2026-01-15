package com.dispatch.service;

import com.dispatch.entity.DeviceToken;
import com.dispatch.entity.User;
import com.dispatch.repository.DeviceTokenRepository;
import com.google.firebase.messaging.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class FcmService {

    private final FirebaseMessaging firebaseMessaging;
    private final DeviceTokenRepository deviceTokenRepository;

    @Autowired
    public FcmService(
            @Autowired(required = false) FirebaseMessaging firebaseMessaging,
            DeviceTokenRepository deviceTokenRepository) {
        this.firebaseMessaging = firebaseMessaging;
        this.deviceTokenRepository = deviceTokenRepository;
    }

    @Value("${firebase.enabled:false}")
    private boolean firebaseEnabled;

    /**
     * 단일 사용자에게 푸시 알림 전송
     */
    @Async
    public void sendToUser(Long userId, String title, String body, Map<String, String> data) {
        if (!firebaseEnabled || firebaseMessaging == null) {
            log.debug("Firebase is disabled, skipping push notification");
            return;
        }

        List<DeviceToken> tokens = deviceTokenRepository.findByUserIdAndActiveTrue(userId);
        if (tokens.isEmpty()) {
            log.debug("No active device tokens for user: {}", userId);
            return;
        }

        List<String> tokenStrings = tokens.stream()
                .map(DeviceToken::getToken)
                .toList();

        sendToTokens(tokenStrings, title, body, data);
    }

    /**
     * 여러 사용자에게 푸시 알림 전송
     */
    @Async
    public void sendToUsers(List<Long> userIds, String title, String body, Map<String, String> data) {
        if (!firebaseEnabled || firebaseMessaging == null) {
            return;
        }

        List<DeviceToken> tokens = deviceTokenRepository.findByUserIdInAndActiveTrue(userIds);
        if (tokens.isEmpty()) {
            return;
        }

        List<String> tokenStrings = tokens.stream()
                .map(DeviceToken::getToken)
                .toList();

        sendToTokens(tokenStrings, title, body, data);
    }

    /**
     * 특정 역할의 모든 사용자에게 푸시 알림 전송
     */
    @Async
    public void sendToRole(User.UserRole role, String title, String body, Map<String, String> data) {
        if (!firebaseEnabled || firebaseMessaging == null) {
            return;
        }

        List<DeviceToken> tokens = deviceTokenRepository.findByUserRoleAndActiveTrue(role);
        if (tokens.isEmpty()) {
            return;
        }

        List<String> tokenStrings = tokens.stream()
                .map(DeviceToken::getToken)
                .toList();

        sendToTokens(tokenStrings, title, body, data);
    }

    /**
     * 토큰 목록에 푸시 알림 전송
     */
    private void sendToTokens(List<String> tokens, String title, String body, Map<String, String> data) {
        if (tokens.isEmpty()) {
            return;
        }

        // 데이터가 없으면 빈 맵 사용
        Map<String, String> messageData = data != null ? data : new HashMap<>();

        // Android 설정
        AndroidConfig androidConfig = AndroidConfig.builder()
                .setNotification(AndroidNotification.builder()
                        .setTitle(title)
                        .setBody(body)
                        .setIcon("ic_notification")
                        .setColor("#2563EB")
                        .setSound("default")
                        .setChannelId("dispatch_channel")
                        .build())
                .setPriority(AndroidConfig.Priority.HIGH)
                .build();

        // iOS 설정
        ApnsConfig apnsConfig = ApnsConfig.builder()
                .setAps(Aps.builder()
                        .setAlert(ApsAlert.builder()
                                .setTitle(title)
                                .setBody(body)
                                .build())
                        .setSound("default")
                        .setBadge(1)
                        .build())
                .build();

        // 웹 푸시 설정
        WebpushConfig webpushConfig = WebpushConfig.builder()
                .setNotification(WebpushNotification.builder()
                        .setTitle(title)
                        .setBody(body)
                        .setIcon("/icons/icon-192x192.png")
                        .build())
                .build();

        try {
            // 500개씩 배치로 전송 (FCM 제한)
            int batchSize = 500;
            List<String> failedTokens = new ArrayList<>();

            for (int i = 0; i < tokens.size(); i += batchSize) {
                List<String> batch = tokens.subList(i, Math.min(i + batchSize, tokens.size()));

                MulticastMessage message = MulticastMessage.builder()
                        .addAllTokens(batch)
                        .setNotification(Notification.builder()
                                .setTitle(title)
                                .setBody(body)
                                .build())
                        .putAllData(messageData)
                        .setAndroidConfig(androidConfig)
                        .setApnsConfig(apnsConfig)
                        .setWebpushConfig(webpushConfig)
                        .build();

                BatchResponse response = firebaseMessaging.sendEachForMulticast(message);

                log.info("FCM sent: success={}, failure={}", response.getSuccessCount(), response.getFailureCount());

                // 실패한 토큰 수집
                if (response.getFailureCount() > 0) {
                    List<SendResponse> responses = response.getResponses();
                    for (int j = 0; j < responses.size(); j++) {
                        if (!responses.get(j).isSuccessful()) {
                            String errorCode = responses.get(j).getException() != null ?
                                    responses.get(j).getException().getMessagingErrorCode().name() : "UNKNOWN";

                            // 유효하지 않은 토큰은 비활성화
                            if ("UNREGISTERED".equals(errorCode) || "INVALID_ARGUMENT".equals(errorCode)) {
                                failedTokens.add(batch.get(j));
                            }

                            log.warn("FCM failed for token: error={}", errorCode);
                        }
                    }
                }
            }

            // 실패한 토큰 비활성화
            if (!failedTokens.isEmpty()) {
                deactivateTokens(failedTokens);
            }

        } catch (FirebaseMessagingException e) {
            log.error("FCM send failed: {}", e.getMessage());
        }
    }

    /**
     * 디바이스 토큰 등록/갱신
     */
    @Transactional
    public void registerToken(User user, String token, DeviceToken.DeviceType deviceType) {
        // 기존 토큰 확인
        deviceTokenRepository.findByToken(token).ifPresentOrElse(
                existingToken -> {
                    // 같은 사용자면 갱신, 다른 사용자면 이전 것 비활성화
                    if (!existingToken.getUser().getId().equals(user.getId())) {
                        existingToken.setActive(false);
                        deviceTokenRepository.save(existingToken);

                        // 새 토큰 생성
                        createNewToken(user, token, deviceType);
                    } else {
                        existingToken.setActive(true);
                        deviceTokenRepository.save(existingToken);
                    }
                },
                () -> createNewToken(user, token, deviceType)
        );

        log.info("FCM token registered: userId={}, deviceType={}", user.getId(), deviceType);
    }

    private void createNewToken(User user, String token, DeviceToken.DeviceType deviceType) {
        DeviceToken deviceToken = DeviceToken.builder()
                .user(user)
                .token(token)
                .deviceType(deviceType)
                .active(true)
                .build();
        deviceTokenRepository.save(deviceToken);
    }

    /**
     * 토큰 비활성화
     */
    @Transactional
    public void deactivateToken(String token) {
        deviceTokenRepository.findByToken(token).ifPresent(deviceToken -> {
            deviceToken.setActive(false);
            deviceTokenRepository.save(deviceToken);
        });
    }

    /**
     * 여러 토큰 비활성화
     */
    @Transactional
    public void deactivateTokens(List<String> tokens) {
        deviceTokenRepository.deactivateByTokens(tokens);
        log.info("Deactivated {} invalid FCM tokens", tokens.size());
    }

    /**
     * 사용자의 모든 토큰 비활성화 (로그아웃 시)
     */
    @Transactional
    public void deactivateUserTokens(Long userId) {
        deviceTokenRepository.deactivateByUserId(userId);
    }
}
