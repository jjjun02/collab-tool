import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { register as registerApi } from '../../api/auth'
import { getErrorMessage } from '../../utils/error'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm()

  const password = watch('password')

  const onSubmit = async (data) => {
    const { passwordConfirm, ...payload } = data
    setLoading(true)
    try {
      await registerApi(payload)
      toast.success('회원가입이 완료되었습니다.')
      navigate('/login')
    } catch (error) {
      const status = error.response?.status
      if (status === 409) {
        setError('email', { message: '이미 사용 중인 이메일입니다.' })
      } else {
        toast.error(getErrorMessage(error))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h2 className="text-xl font-bold mb-6">회원가입</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">이름</label>
          <input
            className="input"
            placeholder="이름 (최대 100자)"
            maxLength={100}
            {...register('name', { required: '이름을 입력해주세요.', maxLength: 100 })}
          />
          {errors.name && <p className="error-text">{errors.name.message}</p>}
        </div>
        <div>
          <label className="label">이메일</label>
          <input
            type="email"
            className="input"
            placeholder="이메일"
            {...register('email', {
              required: '이메일을 입력해주세요.',
              pattern: { value: /^\S+@\S+\.\S+$/, message: '이메일 형식이 올바르지 않습니다.' },
            })}
          />
          {errors.email && <p className="error-text">{errors.email.message}</p>}
        </div>
        <div>
          <label className="label">비밀번호</label>
          <input
            type="password"
            className="input"
            placeholder="비밀번호 (8자 이상)"
            {...register('password', {
              required: '비밀번호를 입력해주세요.',
              minLength: { value: 8, message: '비밀번호는 8자 이상이어야 합니다.' },
            })}
          />
          {errors.password && <p className="error-text">{errors.password.message}</p>}
        </div>
        <div>
          <label className="label">비밀번호 확인</label>
          <input
            type="password"
            className="input"
            placeholder="비밀번호 재입력"
            {...register('passwordConfirm', {
              required: '비밀번호를 다시 입력해주세요.',
              validate: (v) => v === password || '비밀번호가 일치하지 않습니다.',
            })}
          />
          {errors.passwordConfirm && <p className="error-text">{errors.passwordConfirm.message}</p>}
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? '가입 중...' : '가입하기'}
        </button>
      </form>
      <p className="text-center text-sm text-slate-500 mt-6">
        이미 계정이 있으신가요?{' '}
        <Link to="/login" className="text-brand-600 font-medium hover:underline">
          로그인
        </Link>
      </p>
    </>
  )
}
