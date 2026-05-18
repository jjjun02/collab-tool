import api from './axios'

// API-T-001: Task 생성
export const createTask = (projectId, data) =>
  api.post(`/projects/${projectId}/tasks`, data)

// API-T-002: Task 목록 조회 (필터: assigneeId, status)
export const getTasks = (projectId, filters = {}) =>
  api.get(`/projects/${projectId}/tasks`, { params: filters })

// API-T-003: Task 상세
export const getTask = (projectId, taskId) =>
  api.get(`/projects/${projectId}/tasks/${taskId}`)

// API-T-004: Task 수정
export const updateTask = (projectId, taskId, data) =>
  api.put(`/projects/${projectId}/tasks/${taskId}`, data)

// API-T-005: Task 상태 변경
export const updateTaskStatus = (projectId, taskId, status) =>
  api.patch(`/projects/${projectId}/tasks/${taskId}/status`, { status })

// API-T-006: Task 삭제
export const deleteTask = (projectId, taskId) =>
  api.delete(`/projects/${projectId}/tasks/${taskId}`)
