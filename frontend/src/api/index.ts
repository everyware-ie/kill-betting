import apiClient from './client';
import type {
  ApiResponse,
  TokenResponse,
  SignUpRequest,
  LoginRequest,
  User,
  CreateSessionRequest,
  SessionResponse,
  ScoreboardResponse,
  TeamResponse,
} from '../types';

// Auth API
export const authApi = {
  signUp: (data: SignUpRequest) =>
    apiClient.post<ApiResponse<TokenResponse>>('/auth/signup', data),

  login: (data: LoginRequest) =>
    apiClient.post<ApiResponse<TokenResponse>>('/auth/login', data),

  getMe: () =>
    apiClient.get<ApiResponse<User>>('/auth/me'),
};

// Session API
export const sessionApi = {
  create: (data: CreateSessionRequest) =>
    apiClient.post<ApiResponse<SessionResponse>>('/sessions', data),

  getMy: () =>
    apiClient.get<ApiResponse<SessionResponse[]>>('/sessions/my'),

  start: (sessionId: number) =>
    apiClient.post<ApiResponse<void>>(`/sessions/${sessionId}/start`),

  getScoreboard: (sessionId: number) =>
    apiClient.get<ApiResponse<ScoreboardResponse>>(`/sessions/${sessionId}/scoreboard`),
};

// Team API
export const teamApi = {
  create: (sessionId: number, name: string) =>
    apiClient.post<ApiResponse<TeamResponse>>(`/sessions/${sessionId}/teams`, { name }),

  addMember: (sessionId: number, teamId: number, userId: number) =>
    apiClient.post<ApiResponse<TeamResponse>>(
      `/sessions/${sessionId}/teams/${teamId}/members`,
      { userId }
    ),

  getTeams: (sessionId: number) =>
    apiClient.get<ApiResponse<TeamResponse[]>>(`/sessions/${sessionId}/teams`),
};
