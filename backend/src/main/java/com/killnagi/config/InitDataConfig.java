package com.killnagi.config;

import com.killnagi.domain.user.entity.User;
import com.killnagi.domain.user.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@Profile("local")
public class InitDataConfig {

    @Bean
    CommandLineRunner initTestUsers(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            // 기존 테스트 계정 제외하고 새로 추가
            for (int i = 4; i <= 8; i++) {
                String nickname = "test" + i;
                String email = "test" + i + "@example.com";

                // 이미 존재하면 스킵
                if (userRepository.findByNickname(nickname).isPresent()) {
                    continue;
                }

                User user = User.builder()
                    .nickname(nickname)
                    .email(email)
                    .password(passwordEncoder.encode("password" + i))
                    .build();

                userRepository.save(user);
            }
        };
    }
}
