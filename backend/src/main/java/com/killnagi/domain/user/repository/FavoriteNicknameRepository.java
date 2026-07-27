package com.killnagi.domain.user.repository;

import com.killnagi.domain.user.entity.FavoriteNickname;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FavoriteNicknameRepository extends JpaRepository<FavoriteNickname, Long> {

    List<FavoriteNickname> findByUser_IdOrderByCreatedAtDesc(Long userId);

    int countByUser_Id(Long userId);

    boolean existsByUser_IdAndNickname(Long userId, String nickname);

    Optional<FavoriteNickname> findByIdAndUser_Id(Long id, Long userId);
}
