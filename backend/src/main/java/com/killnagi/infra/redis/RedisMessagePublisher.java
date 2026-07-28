package com.killnagi.infra.redis;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class RedisMessagePublisher {

    private static final String STOMP_CHANNEL = "killnagi:stomp";

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public void publish(String destination, Object payload) {
        try {
            String json = objectMapper.writeValueAsString(new RedisStompMessage(destination, payload));
            redisTemplate.convertAndSend(STOMP_CHANNEL, json);
        } catch (JsonProcessingException e) {
            log.error("Redis 메시지 발행 실패: destination={}", destination, e);
        }
    }
}