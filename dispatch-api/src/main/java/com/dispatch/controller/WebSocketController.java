package com.dispatch.controller;

import com.dispatch.dto.websocket.LocationUpdate;
import com.dispatch.dto.websocket.WebSocketMessage;
import com.dispatch.entity.DispatchRequest;
import com.dispatch.entity.Driver;
import com.dispatch.exception.CustomException;
import com.dispatch.repository.DispatchMatchRepository;
import com.dispatch.repository.DispatchRequestRepository;
import com.dispatch.repository.DriverRepository;
import com.dispatch.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;

@Slf4j
@Controller
@RequiredArgsConstructor
public class WebSocketController {

    private final DriverRepository driverRepository;
    private final DispatchRequestRepository dispatchRequestRepository;
    private final DispatchMatchRepository dispatchMatchRepository;
    private final NotificationService notificationService;

    /**
     * 기사 위치 업데이트 수신
     * 클라이언트에서 /app/location 으로 전송
     */
    @MessageMapping("/location")
    public void updateLocation(@Payload LocationUpdate locationUpdate, Authentication authentication) {
        if (authentication == null) {
            log.warn("Unauthenticated location update attempt");
            return;
        }

        String email = authentication.getName();
        log.debug("Location update from {}: lat={}, lng={}",
                email, locationUpdate.getLatitude(), locationUpdate.getLongitude());

        // 기사 정보 업데이트
        driverRepository.findByUserEmail(email).ifPresent(driver -> {
            driver.setLatitude(locationUpdate.getLatitude());
            driver.setLongitude(locationUpdate.getLongitude());
            driver.setLocationUpdatedAt(LocalDateTime.now());
            driverRepository.save(driver);

            // 현재 진행 중인 배차가 있으면 직원에게 위치 알림
            dispatchMatchRepository.findActiveMatchByDriver(driver).ifPresent(match -> {
                DispatchRequest dispatch = match.getRequest();
                LocationUpdate update = LocationUpdate.of(
                        driver.getId(),
                        driver.getUser().getName(),
                        dispatch.getId(),
                        locationUpdate.getLatitude(),
                        locationUpdate.getLongitude()
                );
                update.setHeading(locationUpdate.getHeading());
                update.setSpeed(locationUpdate.getSpeed());

                notificationService.notifyLocationUpdate(dispatch, update);
            });
        });
    }

    /**
     * 연결 확인용 ping
     */
    @MessageMapping("/ping")
    @SendToUser("/queue/pong")
    public WebSocketMessage<String> ping() {
        return WebSocketMessage.of(
                WebSocketMessage.MessageType.SYSTEM_NOTICE,
                "Pong",
                "WebSocket connection is alive",
                "pong"
        );
    }
}
