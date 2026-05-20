import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-brand-600">실시간 프로젝트 협력 툴</h1>
          <p className="text-sm text-slate-500 mt-2">팀과 함께 빠르게 협업하세요</p>
        </div>
        <div className="card p-8">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
