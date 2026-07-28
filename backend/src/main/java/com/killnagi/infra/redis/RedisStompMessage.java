package com.killnagi.infra.redis;

public record RedisStompMessage(String destination, Object payload) {
}