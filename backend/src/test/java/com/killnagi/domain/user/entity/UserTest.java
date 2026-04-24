package com.killnagi.domain.user.entity;

import com.killnagi.support.TestFixtures;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("User 엔티티 도메인 로직 테스트")
class UserTest {

    @Test
    void 세션_기록_없을때_승률은_0이다() {
        User user = TestFixtures.user();
        assertThat(user.getWinRate()).isEqualTo(0.0);
    }

    @Test
    void 승리_기록시_총세션과_승리수가_증가한다() {
        User user = TestFixtures.user();
        user.recordWin();
        assertThat(user.getTotalSessions()).isEqualTo(1);
        assertThat(user.getWins()).isEqualTo(1);
    }

    @Test
    void 패배_기록시_총세션과_패배수가_증가한다() {
        User user = TestFixtures.user();
        user.recordLoss();
        assertThat(user.getTotalSessions()).isEqualTo(1);
        assertThat(user.getLosses()).isEqualTo(1);
    }

    @Test
    void 승률은_백분율로_계산된다() {
        User user = TestFixtures.user();
        user.recordWin();
        user.recordLoss();
        assertThat(user.getWinRate()).isEqualTo(50.0);
    }

    @Test
    void 동일한_ID면_hasId가_true를_반환한다() {
        User user = TestFixtures.user(1L);
        assertThat(user.hasId(1L)).isTrue();
    }

    @Test
    void 다른_ID면_hasId가_false를_반환한다() {
        User user = TestFixtures.user(1L);
        assertThat(user.hasId(99L)).isFalse();
    }
}