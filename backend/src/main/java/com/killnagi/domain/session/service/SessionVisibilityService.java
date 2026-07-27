package com.killnagi.domain.session.service;

import com.killnagi.common.exception.KillnagiException;
import com.killnagi.domain.session.entity.HiddenSession;
import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.session.repository.HiddenSessionRepository;
import com.killnagi.domain.session.repository.SessionRepository;
import com.killnagi.domain.user.entity.User;
import com.killnagi.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class SessionVisibilityService {

    private final HiddenSessionRepository hiddenSessionRepository;
    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;

    public void hide(Long sessionId, Long userId) {
        if (hiddenSessionRepository.existsBySession_IdAndUser_Id(sessionId, userId)) {
            return;
        }

        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> KillnagiException.notFound("세션을 찾을 수 없습니다."));
        User user = userRepository.getReferenceById(userId);

        hiddenSessionRepository.save(HiddenSession.builder()
                .session(session)
                .user(user)
                .build());
    }

    public void restore(Long sessionId, Long userId) {
        hiddenSessionRepository.deleteBySessionIdAndUserId(sessionId, userId);
    }
}