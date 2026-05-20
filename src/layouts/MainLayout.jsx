import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { logout as logoutApi } from '../api/auth'
import toast from 'react-hot-toast'

export default function MainLayout() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)

  const handleLogout = async () => {
    try {
      await logoutApi()
    } catch (e) {
      // 로그아웃 API 실패해도 토큰은 삭제
    }
    clearAuth()
    toast.success('로그아웃되었습니다.')
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/projects" className="text-lg font-bold text-brand-600">
            실시간 프로젝트 협력 툴
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            {user?.role === 'admin' && (
              <Link to="/admin/logs" className="text-slate-600 hover:text-brand-600">
                오류 로그
              </Link>
            )}
            <Link to="/profile" className="text-slate-600 hover:text-brand-600">
              {user?.name || '내 정보'}
            </Link>
            <button onClick={handleLogout} className="text-slate-500 hover:text-red-500">
              로그아웃
            </button>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
