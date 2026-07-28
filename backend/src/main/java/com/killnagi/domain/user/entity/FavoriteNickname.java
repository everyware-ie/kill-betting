package com.killnagi.domain.user.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * 자주 쓰는 배그 닉네임 즐겨찾기.
 * 세션에 종속되지 않고 사용자 단위로 보관되어 다음 세션에서도 재사용된다.
 */
@Entity
@Table(
        name = "favorite_nicknames",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_favorite_nickname_user_nickname",
                columnNames = {"user_id", "nickname"}
        )
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class FavoriteNickname {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 100)
    private String nickname;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public Long getUserId() {
        return this.user != null ? this.user.getId() : null;
    }

    public boolean isOwnedBy(Long userId) {
        return userId != null && userId.equals(getUserId());
    }
}
