package com.killnagi.domain.session.service;

import com.killnagi.common.exception.KillnagiException;
import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.session.entity.SessionUser;
import com.killnagi.domain.session.entity.SessionUser.SessionUserStatus;
import com.killnagi.domain.session.repository.SessionRepository;
import com.killnagi.domain.session.repository.SessionUserRepository;
import com.killnagi.domain.user.entity.User;
import com.killnagi.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SessionUserService {

    private final SessionRepository sessionRepository;
    private final SessionUserRepository sessionUserRepository;
    private final UserRepository userRepository;

    @Transactional
    public void joinByWebSocket(Long sessionId, Long userId) {
        if (sessionUserRepository.existsBySession_IdAndUser_Id(sessionId, userId)) {
            return;
        }

        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> KillnagiException.notFound("세션을 찾을 수 없습니다."));

        if (!session.isWaiting()) {
            throw KillnagiException.badRequest("대기 중인 세션에만 입장할 수 있습니다.");
        }

        if (session.isHostedBy(userId)) {
            throw KillnagiException.badRequest("호스트는 대기석에 입장할 수 없습니다.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> KillnagiException.notFound("사용자를 찾을 수 없습니다."));

        sessionUserRepository.save(SessionUser.builder()
                .session(session)
                .user(user)
                .build());
    }

    @Transactional
    public void leaveByWebSocket(Long sessionId, Long userId) {
        sessionUserRepository.deleteBySession_IdAndUser_Id(sessionId, userId);
    }

    public List<SessionUser> getActiveUsers(Long sessionId) {
        return sessionUserRepository.findBySession_IdAndStatus(sessionId, SessionUserStatus.ACTIVE);
    }
}
