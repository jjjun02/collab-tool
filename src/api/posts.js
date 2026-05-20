import api from './axios'

// API-B-001: 게시글 작성
export const createPost = (projectId, data) =>
  api.post(`/projects/${projectId}/posts`, data)

// API-B-002: 게시글 목록 (페이지네이션)
export const getPosts = (projectId, page = 1, size = 10) =>
  api.get(`/projects/${projectId}/posts`, { params: { page, size } })

// API-B-003: 게시글 상세
export const getPost = (projectId, postId) =>
  api.get(`/projects/${projectId}/posts/${postId}`)

// API-B-004: 게시글 수정
export const updatePost = (projectId, postId, data) =>
  api.put(`/projects/${projectId}/posts/${postId}`, data)

// API-B-005: 게시글 삭제
export const deletePost = (projectId, postId) =>
  api.delete(`/projects/${projectId}/posts/${postId}`)

// API-B-006: 댓글 작성
export const createComment = (projectId, postId, content) =>
  api.post(`/projects/${projectId}/posts/${postId}/comments`, { content })

// API-B-007: 댓글 삭제
export const deleteComment = (projectId, postId, commentId) =>
  api.delete(`/projects/${projectId}/posts/${postId}/comments/${commentId}`)
