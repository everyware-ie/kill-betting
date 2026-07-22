package com.killnagi.domain.admin.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.killnagi.domain.admin.dto.response.AdminMetricsResponse;
import com.killnagi.domain.user.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
@DisplayName("AdminMetricsService 운영 지표 집계 테스트")
class AdminMetricsServiceTest {

    @Mock
    UserRepository userRepository;

    @InjectMocks
    AdminMetricsService adminMetricsService;

    @Test
    @DisplayName("전체 가입 유저 수를 총 가입 수로 반환한다")
    void 전체_가입_유저_수를_총_가입_수로_반환한다() {
        // given
        given(userRepository.count()).willReturn(42L);

        // when
        AdminMetricsResponse response = adminMetricsService.getMetrics();

        // then
        assertThat(response.totalUsers()).isEqualTo(42L);
    }
}