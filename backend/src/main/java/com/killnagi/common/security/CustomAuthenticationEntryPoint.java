package com.killnagi.common.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.killnagi.common.response.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class CustomAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final RequestMappingHandlerMapping handlerMapping;
    private final ObjectMapper objectMapper;

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException authException) throws IOException {
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");

        if (isEndpointExists(request)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            objectMapper.writeValue(response.getWriter(),
                    ApiResponse.fail("인증이 필요합니다"));
        } else {
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            objectMapper.writeValue(response.getWriter(),
                    ApiResponse.fail("요청한 API를 찾을 수 없습니다"));
        }
    }

    private boolean isEndpointExists(HttpServletRequest request) {
        try {
            return handlerMapping.getHandler(request) != null;
        } catch (Exception e) {
            return false;
        }
    }
}
