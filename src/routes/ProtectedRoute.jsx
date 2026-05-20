import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function ProtectedRoute({ children, adminOnly = false }) {
  const location = useLocation()
  const token = localStorage.getItem('accessToken')
  const user = useAuthStore((s) => s.user)

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/projects" replace />
  }

  return children
}
