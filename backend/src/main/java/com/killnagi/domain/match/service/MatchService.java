package com.killnagi.domain.match.service;

import com.killnagi.common.storage.FileStorageService;
import com.killnagi.domain.match.dto.MatchDto;
import com.killnagi.domain.match.entity.Match;
import com.killnagi.domain.match.repository.MatchRepository;
import com.killnagi.domain.session.entity.Session;
import com.killnagi.domain.team.entity.Team;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class MatchService {

    private static final String SCREENSHOT_DIR = "screenshots";

    private final MatchRepository matchRepository;
    private final FileStorageService fileStorageService;

    @Transactional
    public MatchDto.ScreenshotUploadResponse uploadScreenshot(Session session, Team team, MultipartFile file) {
        String url = fileStorageService.store(file, SCREENSHOT_DIR);
        int matchNumber = matchRepository.countBySessionId(session.getId()) + 1;

        Match match = Match.builder()
                .session(session)
                .team(team)
                .matchNumber(matchNumber)
                .screenshotUrl(url)
                .build();
        matchRepository.save(match);

        return new MatchDto.ScreenshotUploadResponse(match.getId(), url);
    }
}
