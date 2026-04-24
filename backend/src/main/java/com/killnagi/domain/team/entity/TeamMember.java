package com.killnagi.domain.team.entity;

import com.killnagi.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "team_members")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TeamMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "is_uploader", nullable = false)
    private boolean isUploader = false;

    @Column(name = "total_kills", nullable = false)
    private int totalKills = 0;

    @Builder
    public TeamMember(Team team, User user, boolean isUploader) {
        this.team = team;
        this.user = user;
        this.isUploader = isUploader;
    }

    public void addKills(int kills) {
        this.totalKills += kills;
    }

    public Long getUserId() {
        return this.user.getId();
    }

    public String getUserNickname() {
        return this.user.getNickname();
    }
}
