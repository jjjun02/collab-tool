import api from './axios'

// API-U-001: 회원가입
export const register = (data) => api.post('/auth/register', data)

// API-U-002: 로그인
export const login = (data) => api.post('/auth/login', data)

// API-U-003: 로그아웃
export const logout = () => api.post('/auth/logout')
