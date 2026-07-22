package com.killnagi.common.security;

import java.util.function.Supplier;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import com.killnagi.domain.user.repository.UserRepository;

/**
 * 어드민 지표 대시보드 접근 제어. 인증된 유저의 이메일이 지정된 단일 어드민 이메일과
 * 일치할 때만 접근을 허용한다. (principal의 username은 userId이므로 email 조회가 필요하다)
 */
@Component
public class AdminAccessManager implements AuthorizationManager<RequestAuthorizationContext> {

    private final UserRepository userRepository;
    private final String adminEmail;

    public AdminAccessManager(UserRepository userRepository,
                              @Value("${admin.email:}") String adminEmail) {
        this.userRepository = userRepository;
        this.adminEmail = adminEmail;
    }

    @Override
    public AuthorizationDecision check(Supplier<Authentication> authentication,
                                       RequestAuthorizationContext context) {
        return new AuthorizationDecision(isAdmin(authentication.get()));
    }

    private boolean isAdmin(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()
                || !StringUtils.hasText(adminEmail)) {
            return false;
        }
        return userRepository.findById(parseUserId(authentication.getName()))
                .map(user -> adminEmail.equals(user.getEmail()))
                .orElse(false);
    }

    private Long parseUserId(String name) {
        try {
            return Long.parseLong(name);
        } catch (NumberFormatException e) {
            return -1L;
        }
    }
}