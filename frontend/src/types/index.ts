// Auth
export interface User {
  id: number;
  nickname: string;
  email: string;
  pubgNickname?: string;
  totalSessions: number;
  wins: number;
  losses: number;
  winRate: number;
}

export interface TokenResponse {
  accessToken: string;
  tokenType: string;
  userId: number;
  nickname: string;
}

export interface SignUpRequest {
  nickname: string;
  email: string;
  password: string;
  pubgNickname?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// Session
export type SessionStatus = 'WAITING' | 'IN_PROGRESS' | 'ENDED';

export type RuleType =
  | 'CHICKEN_BONUS'
  | 'SURVIVAL_PENALTY'
  | 'CONSECUTIVE_DEATH_PENALTY'
  | 'PLACEMENT_BONUS';

export interface RuleRequest {
  ruleType: RuleType;
  killValue: number;
}

export interface CreateSessionRequest {
  name: string;
  targetKills?: number;
  timeLimitMinutes?: number;
  rules?: RuleRequest[];
}

export interface SessionResponse {
  id: number;
  name: string;
  hostNickname: string;
  status: SessionStatus;
  targetKills?: number;
  timeLimitMinutes?: number;
  createdAt: string;
}

// Scoreboard
export interface MemberScore {
  userId: number;
  nickname: string;
  totalKills: number;
}

export interface TeamScore {
  teamId: number;
  teamName: string;
  totalKills: number;
  bonusKills: number;
  penaltyKills: number;
  effectiveKills: number;
  members: MemberScore[];
}

export interface ScoreboardResponse {
  sessionId: number;
  sessionName: string;
  status: SessionStatus;
  teams: TeamScore[];
}

// Team
export interface TeamResponse {
  id: number;
  name: string;
  effectiveKills: number;
  memberNicknames: string[];
}

// API
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
