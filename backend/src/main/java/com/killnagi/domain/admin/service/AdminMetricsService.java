package com.killnagi.domain.admin.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.killnagi.domain.admin.dto.response.AdminMetricsResponse;
import com.killnagi.domain.user.repository.UserRepository;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class AdminMetricsService {

    private final UserRepository userRepository;

    public AdminMetricsResponse getMetrics() {
        return new AdminMetricsResponse(userRepository.count());
    }
}