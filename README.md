# 🎮 킬내기 플랫폼

배틀그라운드 킬내기 세션 관리 플랫폼 MVP

---

## 프로젝트 구조

```
killnagi/
├── backend/          # Spring Boot (Java 21)
└── frontend/         # React (JavaScript)
```

---

## 백엔드 실행 방법

### 사전 준비
- Java 21
- MySQL 8.x

### 1. 데이터베이스 생성
```sql
CREATE DATABASE killnagi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. application.yml 수정
`backend/src/main/resources/application.yml` 파일에서:
```yaml
spring:
  datasource:
    username: root           # 본인 MySQL 계정
    password: root  # 본인 MySQL 비밀번호

jwt:
  secret: your-super-secret-jwt-key-must-be-at-least-256-bits-long-for-hs256
  # 반드시 32자 이상의 안전한 문자열로 변경하세요
```

### 3. 실행
```bash
cd backend
./gradlew bootRun      # macOS/Linux
gradlew.bat bootRun    # Windows
```

서버: `http://localhost:8080`

---

## 프론트엔드 실행 방법

### 사전 준비
- Node.js 18+
- npm 또는 yarn

### 실행
```bash
cd frontend
npm install
npm start
```

앱: `http://localhost:3000`  
(백엔드 API는 package.json의 proxy 설정으로 자동 연결)

---

## API 명세

### 인증
| Method | URL | 설명 |
|--------|-----|------|
| POST | /api/auth/signup | 회원가입 |
| POST | /api/auth/login | 로그인 |
| GET | /api/auth/me | 내 정보 조회 |

### 세션
| Method | URL | 설명 |
|--------|-----|------|
| POST | /api/sessions | 세션 생성 |
| GET | /api/sessions/my | 내 세션 목록 |
| POST | /api/sessions/{id}/start | 세션 시작 |
| GET | /api/sessions/{id}/scoreboard | 스코어보드 조회 |

### 팀
| Method | URL | 설명 |
|--------|-----|------|
| POST | /api/sessions/{id}/teams | 팀 생성 |
| GET | /api/sessions/{id}/teams | 팀 목록 조회 |
| POST | /api/sessions/{id}/teams/{teamId}/members | 멤버 추가 |

---

## 도메인 구조

```
User (사용자)
Session (킬내기 세션)
  ├── Team (팀)
  │   └── TeamPlayer (플레이어 슬롯)
  ├── Match (매치)
  │   └── MatchResult (매치 결과)
  └── Rule (규칙)
```

---

## 기술 스택

### 백엔드
- Java 21
- Spring Boot 3.3
- Spring Security + JWT
- Spring Data JPA
- MySQL 8

### 프론트엔드
- React 18 (JavaScript)
- Next.js (App Router)
- Context API (전역 상태)
