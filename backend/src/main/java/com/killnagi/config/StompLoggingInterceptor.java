package com.killnagi.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;

@Slf4j
@Component
public class StompLoggingInterceptor implements ChannelInterceptor {

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) return message;

        StompCommand command = accessor.getCommand();
        if (command == null) return message;

        String user = accessor.getUser() != null ? accessor.getUser().getName() : "anonymous";
        String destination = accessor.getDestination();

        switch (command) {
            case CONNECT -> log.info("[WS] CONNECT user={}", user);
            case SUBSCRIBE -> log.info("[WS] SUBSCRIBE user={} dest={}", user, destination);
            case SEND -> {
                String payload = new String((byte[]) message.getPayload(), StandardCharsets.UTF_8);
                log.info("[WS] SEND user={} dest={} body={}", user, destination, payload);
            }
            case DISCONNECT -> log.info("[WS] DISCONNECT user={}", user);
            default -> {}
        }

        return message;
    }
}
