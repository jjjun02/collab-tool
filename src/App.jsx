import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './routes/ProtectedRoute'
import AuthLayout from './layouts/AuthLayout'
import MainLayout from './layouts/MainLayout'

import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ProfilePage from './pages/auth/ProfilePage'

import ProjectListPage from './pages/projects/ProjectListPage'
import ProjectCreatePage from './pages/projects/ProjectCreatePage'
import ProjectDetailPage from './pages/projects/ProjectDetailPage'
import ProjectJoinPage from './pages/projects/ProjectJoinPage'

import KanbanBoardPage from './pages/tasks/KanbanBoardPage'
import TaskDetailPage from './pages/tasks/TaskDetailPage'

import BoardListPage from './pages/board/BoardListPage'
import PostWritePage from './pages/board/PostWritePage'
import PostDetailPage from './pages/board/PostDetailPage'

import ErrorLogPage from './pages/admin/ErrorLogPage'

export default function App() {
  return (
    <Routes>
      {/* 인증 (비로그인) */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* 로그인 필요 영역 */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/projects" element={<ProjectListPage />} />
        <Route path="/projects/new" element={<ProjectCreatePage />} />
        <Route path="/projects/join" element={<ProjectJoinPage />} />
        <Route path="/projects/:projectId/settings" element={<ProjectDetailPage />} />
        <Route path="/projects/:projectId/kanban" element={<KanbanBoardPage />} />
        <Route path="/projects/:projectId/tasks/:taskId" element={<TaskDetailPage />} />
        <Route path="/projects/:projectId/board" element={<BoardListPage />} />
        <Route path="/projects/:projectId/board/new" element={<PostWritePage />} />
        <Route path="/projects/:projectId/posts/:postId" element={<PostDetailPage />} />

        {/* Admin 전용 */}
        <Route
          path="/admin/logs"
          element={
            <ProtectedRoute adminOnly>
              <ErrorLogPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* 기본 경로 */}
      <Route path="/" element={<Navigate to="/projects" replace />} />
      <Route path="*" element={<Navigate to="/projects" replace />} />
    </Routes>
  )
}
