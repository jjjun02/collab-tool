import api from './axios'

// API-S-001: 오류 로그 조회 (admin)
export const getErrorLogs = (filters = {}) =>
  api.get('/admin/logs', { params: filters })
