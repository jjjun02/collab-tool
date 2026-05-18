import api from './axios'

// API-P-001: 프로젝트 생성
export const createProject = (data) => api.post('/projects', data)

// API-P-002: 프로젝트 목록
export const getProjects = () => api.get('/projects')

// API-P-003: 프로젝트 상세
export const getProject = (id) => api.get(`/projects/${id}`)

// API-P-004: 프로젝트 수정 (admin)
export const updateProject = (id, data) => api.put(`/projects/${id}`, data)

// API-P-005: 프로젝트 삭제 (admin)
export const deleteProject = (id) => api.delete(`/projects/${id}`)

// API-P-006: 초대코드 갱신 (admin)
export const renewInviteCode = (id) => api.put(`/projects/${id}/invite-code`)

// API-P-007: 초대코드로 참여
export const joinProject = (inviteCode) =>
  api.post('/projects/join', { inviteCode })

// API-P-008: 팀원 목록
export const getMembers = (id) => api.get(`/projects/${id}/members`)
