package com.dispatch.service;

import com.dispatch.dto.websocket.DispatchNotification;
import com.dispatch.dto.websocket.LocationUpdate;
import com.dispatch.dto.websocket.WebSocketMessage;
import com.dispatch.dto.websocket.WebSocketMessage.MessageType;
import com.dispatch.entity.DispatchMatch;
import com.dispatch.entity.DispatchRequest;
import com.dispatch.entity.Driver;
import com.dispatch.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final SimpMessagingTemplate messagingTemplate;
    private final FcmService fcmService;

    /**
     * 새 배차 등록 알림 - 모든 활성 기사에게 브로드캐스트
     */
    public void notifyNewDispatch(DispatchRequest dispatch) {
        String title = "새 배차 요청";
        String body = String.format("%s 근처 새 배차가 등록되었습니다.", dispatch.getSiteAddress());

        WebSocketMessage<DispatchNotification> message = WebSocketMessage.of(
                MessageType.NEW_DISPATCH,
                title,
                body,
                DispatchNotification.from(dispatch)
        );

        // 모든 기사에게 브로드캐스트 (WebSocket)
        messagingTemplate.convertAndSend("/topic/dispatches", message);

        // FCM 푸시 알림 - 모든 기사에게
        Map<String, String> data = createDispatchData(dispatch);
        fcmService.sendToRole(User.UserRole.DRIVER, title, body, data);

        log.info("New dispatch notification sent: dispatchId={}", dispatch.getId());
    }

    /**
     * 배차 수락 알림 - 요청한 직원에게
     */
    public void notifyDispatchAccepted(DispatchRequest dispatch) {
        notifyDispatchAccepted(dispatch, null);
    }

    public void notifyDispatchAccepted(DispatchRequest dispatch, DispatchMatch match) {
        String title = "배차 수락됨";
        String body = String.format("기사가 배차를 수락했습니다. (배차 #%d)", dispatch.getId());

        WebSocketMessage<DispatchNotification> message = WebSocketMessage.of(
                MessageType.DISPATCH_ACCEPTED,
                title,
                body,
                DispatchNotification.from(dispatch, match)
        );

        // WebSocket
        messagingTemplate.convertAndSendToUser(
                dispatch.getStaff().getEmail(),
                "/queue/notifications",
                message
        );

        // FCM 푸시 알림 - 직원에게
        Map<String, String> data = createDispatchData(dispatch);
        fcmService.sendToUser(dispatch.getStaff().getId(), title, body, data);

        log.info("Dispatch accepted notification sent to staff: {}", dispatch.getStaff().getEmail());
    }

    /**
     * 기사 현장 도착 알림 - 요청한 직원에게
     */
    public void notifyDriverArrived(DispatchRequest dispatch) {
        notifyDriverArrived(dispatch, null);
    }

    public void notifyDriverArrived(DispatchRequest dispatch, DispatchMatch match) {
        String title = "기사 도착";
        String body = String.format("기사가 현장에 도착했습니다. (배차 #%d)", dispatch.getId());

        WebSocketMessage<DispatchNotification> message = WebSocketMessage.of(
                MessageType.DISPATCH_ARRIVED,
                title,
                body,
                DispatchNotification.from(dispatch, match)
        );

        // WebSocket
        messagingTemplate.convertAndSendToUser(
                dispatch.getStaff().getEmail(),
                "/queue/notifications",
                message
        );

        // FCM 푸시 알림 - 직원에게
        Map<String, String> data = createDispatchData(dispatch);
        fcmService.sendToUser(dispatch.getStaff().getId(), title, body, data);

        log.info("Driver arrived notification sent to staff: {}", dispatch.getStaff().getEmail());
    }

    /**
     * 작업 완료 알림 - 요청한 직원에게
     */
    public void notifyDispatchCompleted(DispatchRequest dispatch) {
        notifyDispatchCompleted(dispatch, null);
    }

    public void notifyDispatchCompleted(DispatchRequest dispatch, DispatchMatch match) {
        String title = "작업 완료";
        String body = String.format("작업이 완료되었습니다. (배차 #%d)", dispatch.getId());

        WebSocketMessage<DispatchNotification> message = WebSocketMessage.of(
                MessageType.DISPATCH_COMPLETED,
                title,
                body,
                DispatchNotification.from(dispatch, match)
        );

        // WebSocket
        messagingTemplate.convertAndSendToUser(
                dispatch.getStaff().getEmail(),
                "/queue/notifications",
                message
        );

        // FCM 푸시 알림 - 직원에게
        Map<String, String> data = createDispatchData(dispatch);
        fcmService.sendToUser(dispatch.getStaff().getId(), title, body, data);

        log.info("Dispatch completed notification sent to staff: {}", dispatch.getStaff().getEmail());
    }

    /**
     * 배차 취소 알림 - 관련 당사자들에게
     */
    public void notifyDispatchCancelled(DispatchRequest dispatch) {
        notifyDispatchCancelled(dispatch, null);
    }

    public void notifyDispatchCancelled(DispatchRequest dispatch, DispatchMatch match) {
        String title = "배차 취소";
        String body = String.format("배차가 취소되었습니다. (배차 #%d)", dispatch.getId());

        WebSocketMessage<DispatchNotification> message = WebSocketMessage.of(
                MessageType.DISPATCH_CANCELLED,
                title,
                body,
                DispatchNotification.from(dispatch, match)
        );

        Map<String, String> data = createDispatchData(dispatch);

        // 직원에게 (WebSocket + FCM)
        messagingTemplate.convertAndSendToUser(
                dispatch.getStaff().getEmail(),
                "/queue/notifications",
                message
        );
        fcmService.sendToUser(dispatch.getStaff().getId(), title, body, data);

        // 매칭된 기사가 있으면 기사에게도 (WebSocket + FCM)
        if (match != null && match.getDriver() != null) {
            messagingTemplate.convertAndSendToUser(
                    match.getDriver().getUser().getEmail(),
                    "/queue/notifications",
                    message
            );
            fcmService.sendToUser(match.getDriver().getUser().getId(), title, body, data);
        }

        log.info("Dispatch cancelled notification sent: dispatchId={}", dispatch.getId());
    }

    /**
     * 기사 승인 알림 - 기사에게
     */
    public void notifyDriverApproved(Driver driver) {
        String title = "가입 승인";
        String body = "축하합니다! 기사 등록이 승인되었습니다. 이제 배차를 받을 수 있습니다.";

        WebSocketMessage<Void> message = WebSocketMessage.of(
                MessageType.DRIVER_APPROVED,
                title,
                body,
                null
        );

        // WebSocket
        messagingTemplate.convertAndSendToUser(
                driver.getUser().getEmail(),
                "/queue/notifications",
                message
        );

        // FCM 푸시 알림
        Map<String, String> data = new HashMap<>();
        data.put("type", "DRIVER_APPROVED");
        data.put("driverId", String.valueOf(driver.getId()));
        fcmService.sendToUser(driver.getUser().getId(), title, body, data);

        log.info("Driver approved notification sent: driverId={}", driver.getId());
    }

    /**
     * 기사 거절 알림 - 기사에게
     */
    public void notifyDriverRejected(Driver driver, String reason) {
        String title = "가입 거절";
        String body = "기사 등록이 거절되었습니다. 사유: " + reason;

        WebSocketMessage<String> message = WebSocketMessage.of(
                MessageType.DRIVER_REJECTED,
                title,
                body,
                reason
        );

        // WebSocket
        messagingTemplate.convertAndSendToUser(
                driver.getUser().getEmail(),
                "/queue/notifications",
                message
        );

        // FCM 푸시 알림
        Map<String, String> data = new HashMap<>();
        data.put("type", "DRIVER_REJECTED");
        data.put("driverId", String.valueOf(driver.getId()));
        data.put("reason", reason);
        fcmService.sendToUser(driver.getUser().getId(), title, body, data);

        log.info("Driver rejected notification sent: driverId={}", driver.getId());
    }

    /**
     * 기사 위치 업데이트 - 직원에게
     */
    public void notifyLocationUpdate(DispatchRequest dispatch, LocationUpdate location) {
        WebSocketMessage<LocationUpdate> message = WebSocketMessage.of(
                MessageType.LOCATION_UPDATE,
                "위치 업데이트",
                "기사 위치가 업데이트되었습니다.",
                location
        );

        messagingTemplate.convertAndSendToUser(
                dispatch.getStaff().getEmail(),
                "/queue/location",
                message
        );
    }

    /**
     * 시스템 공지 - 모든 사용자에게
     */
    public void sendSystemNotice(String title, String message) {
        WebSocketMessage<Void> wsMessage = WebSocketMessage.of(
                MessageType.SYSTEM_NOTICE,
                title,
                message,
                null
        );

        // WebSocket
        messagingTemplate.convertAndSend("/topic/notices", wsMessage);

        // FCM - 모든 사용자에게 (모든 역할)
        Map<String, String> data = new HashMap<>();
        data.put("type", "SYSTEM_NOTICE");
        fcmService.sendToRole(User.UserRole.DRIVER, title, message, data);
        fcmService.sendToRole(User.UserRole.STAFF, title, message, data);
        fcmService.sendToRole(User.UserRole.ADMIN, title, message, data);

        log.info("System notice sent: {}", title);
    }

    /**
     * 배차 관련 FCM 데이터 생성
     */
    private Map<String, String> createDispatchData(DispatchRequest dispatch) {
        Map<String, String> data = new HashMap<>();
        data.put("type", "DISPATCH");
        data.put("dispatchId", String.valueOf(dispatch.getId()));
        data.put("status", dispatch.getStatus().name());
        data.put("siteAddress", dispatch.getSiteAddress());
        return data;
    }
}
