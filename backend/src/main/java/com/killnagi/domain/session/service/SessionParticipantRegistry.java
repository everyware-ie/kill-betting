package com.killnagi.domain.session.service;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class SessionParticipantRegistry {

    private record WsInfo(Long sessionId, Long userId) {}

    private final Map<String, WsInfo> wsSessionMap = new ConcurrentHashMap<>();
    private final Map<Long, Set<Long>> sessionParticipants = new ConcurrentHashMap<>();

    public void join(String wsSessionId, Long sessionId, Long userId) {
        wsSessionMap.put(wsSessionId, new WsInfo(sessionId, userId));
        sessionParticipants.computeIfAbsent(sessionId, k -> ConcurrentHashMap.newKeySet()).add(userId);
    }

    // 연결 해제 시 제거, 브로드캐스트 대상 sessionId 반환
    public Long leave(String wsSessionId) {
        WsInfo info = wsSessionMap.remove(wsSessionId);
        if (info == null) return null;
        Set<Long> participants = sessionParticipants.get(info.sessionId());
        if (participants != null) participants.remove(info.userId());
        return info.sessionId();
    }

    public Set<Long> getParticipantIds(Long sessionId) {
        return sessionParticipants.getOrDefault(sessionId, Set.of());
    }

    public boolean isParticipant(Long sessionId, Long userId) {
        Set<Long> participants = sessionParticipants.get(sessionId);
        return participants != null && participants.contains(userId);
    }

    // 테스트용: wsSessionId 없이 직접 제거
    public void removeParticipant(Long sessionId, Long userId) {
        Set<Long> participants = sessionParticipants.get(sessionId);
        if (participants != null) participants.remove(userId);
        wsSessionMap.entrySet().removeIf(e ->
                e.getValue().sessionId().equals(sessionId) && e.getValue().userId().equals(userId));
    }
}