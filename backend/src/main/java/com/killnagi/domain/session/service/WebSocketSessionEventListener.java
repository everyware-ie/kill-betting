package com.killnagi.domain.session.service;

import com.killnagi.domain.team.dto.response.ConfigureStateMessage;
import com.killnagi.domain.team.service.TeamConfigureBroadcaster;
import com.killnagi.domain.team.service.TeamConfigureService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;

import java.security.Principal;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketSessionEventListener {

    private final SessionUserService sessionUserService;
    private final TeamConfigureService teamConfigureService;
    private final TeamConfigureBroadcaster configureBroadcaster;

    // WebSocket 세션 ID → 세션 ID (disconnect 시 어느 세션인지 추적)
    private final Map<String, Long> wsSessionToSessionId = new ConcurrentHashMap<>();

    @EventListener
    public void handleSubscribe(SessionSubscribeEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String destination = accessor.getDestination();

        if (destination == null || !destination.matches("/topic/sessions/\\d+/configure")) {
            return;
        }

        Principal user = accessor.getUser();
        if (user == null) {
            return;
        }

        Long sessionId = extractSessionId(destination);
        String wsSessionId = accessor.getSessionId();
        Long userId = Long.parseLong(user.getName());

        wsSessionToSessionId.put(wsSessionId, sessionId);

        try {
            sessionUserService.joinByWebSocket(sessionId, userId);
            broadcastConfigureState(sessionId);
        } catch (Exception e) {
            log.warn("WebSocket join 실패 - sessionId: {}, userId: {}, reason: {}", sessionId, userId, e.getMessage());
            wsSessionToSessionId.remove(wsSessionId);
        }
    }

    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String wsSessionId = accessor.getSessionId();
        Principal user = accessor.getUser();

        Long sessionId = wsSessionToSessionId.remove(wsSessionId);
        if (sessionId == null || user == null) {
            return;
        }

        Long userId = Long.parseLong(user.getName());

        try {
            sessionUserService.leaveByWebSocket(sessionId, userId);
            broadcastConfigureState(sessionId);
        } catch (Exception e) {
            log.warn("WebSocket leave 실패 - sessionId: {}, userId: {}, reason: {}", sessionId, userId, e.getMessage());
        }
    }

    private Long extractSessionId(String destination) {
        return Long.parseLong(destination.split("/")[3]);
    }

    private void broadcastConfigureState(Long sessionId) {
        ConfigureStateMessage state = teamConfigureService.buildConfigureState(sessionId);
        configureBroadcaster.broadcast(sessionId, state);
    }
}