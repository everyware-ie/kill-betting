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

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketSessionEventListener {

    private final SessionParticipantRegistry registry;
    private final TeamConfigureService teamConfigureService;
    private final TeamConfigureBroadcaster configureBroadcaster;

    @EventListener
    public void handleSubscribe(SessionSubscribeEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String destination = accessor.getDestination();

        if (destination == null || !destination.matches("/topic/sessions/\\d+")) {
            return;
        }

        Principal user = accessor.getUser();
        if (user == null) return;

        Long sessionId = extractSessionId(destination);
        String wsSessionId = accessor.getSessionId();
        Long userId = Long.parseLong(user.getName());

        registry.join(wsSessionId, sessionId, userId);
        broadcastConfigureState(sessionId);
    }

    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String wsSessionId = accessor.getSessionId();

        Long sessionId = registry.leave(wsSessionId);
        if (sessionId == null) return;

        broadcastConfigureState(sessionId);
    }

    private Long extractSessionId(String destination) {
        return Long.parseLong(destination.split("/")[3]);
    }

    private void broadcastConfigureState(Long sessionId) {
        ConfigureStateMessage state = teamConfigureService.buildConfigureState(sessionId);
        configureBroadcaster.broadcast(sessionId, state);
    }
}