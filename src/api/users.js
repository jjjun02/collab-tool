import api from './axios'

// API-U-004: 내 정보 조회
export const getMe = () => api.get('/users/me')

// API-U-005: 내 정보 수정
export const updateMe = (data) => api.put('/users/me', data)
