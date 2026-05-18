import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { login } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'
import { getErrorMessage } from '../../utils/error'

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const res = await login(data)
      // 응답 구조: { status, data: { accessToken, userId, name } }
      const { accessToken, userId, name } = res.data.data
      setAuth({ userId, name }, accessToken)
      navigate('/projects')
    } catch (error) {
      const status = error.response?.status
      if (status === 401) {
        toast.error('이메일 또는 비밀번호가 일치하지 않습니다.')
      } else {
        toast.error(getErrorMessage(error))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h2 className="text-xl font-bold mb-6">로그인</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">이메일</label>
          <input
            type="email"
            className="input"
            placeholder="이메일 입력"
            {...register('email', { required: '이메일을 입력해주세요.' })}
          />
          {errors.email && <p className="error-text">{errors.email.message}</p>}
        </div>
        <div>
          <label className="label">비밀번호</label>
          <input
            type="password"
            className="input"
            placeholder="비밀번호 입력"
            {...register('password', { required: '비밀번호를 입력해주세요.' })}
          />
          {errors.password && <p className="error-text">{errors.password.message}</p>}
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>
      <p className="text-center text-sm text-slate-500 mt-6">
        아직 계정이 없으신가요?{' '}
        <Link to="/register" className="text-brand-600 font-medium hover:underline">
          회원가입
        </Link>
      </p>
    </>
  )
}
