package com.killnagi.infra.redis;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class RedisMessageSubscriber implements MessageListener {

    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    @Override
    public void onMessage(Message message, byte[] pattern) {
        try {
            RedisStompMessage msg = objectMapper.readValue(message.getBody(), RedisStompMessage.class);
            messagingTemplate.convertAndSend(msg.destination(), msg.payload());
        } catch (IOException e) {
            log.error("Redis 메시지 처리 실패", e);
        }
    }
}