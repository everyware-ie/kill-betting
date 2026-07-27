# 기술 부채 & PR 변경 이력

## 기술 부채

### 세션 나가기(leave) API 미구현

- **발견 경위**: [이슈 #111](https://github.com/everyware-ie/kill-betting/issues/111) "내 세션 목록에 Leader 지정 세션 포함" 작업 중 조사.
- **현황**: `SessionUser.leave()` 엔티티 메서드와 `SessionUserRepository.deleteBySession_IdAndUser_Id`가 정의돼 있으나, 운영 코드(Controller/Service) 어디에서도 호출되지 않는다. 테스트 코드에서만 직접 호출됨.
- **영향**: 세션 이탈이라는 개념이 실제로는 동작하지 않는다. `SessionParticipantRegistry`의 WebSocket 연결 해제 처리는 인메모리 참가자 목록만 갱신할 뿐 DB `SessionUser.status`나 `Team.leader`에는 영향을 주지 않는다.
- **후속 조치**: 이탈 플로우가 필요해지면 `/feature-start`로 별도 기능 정의 후 진행.