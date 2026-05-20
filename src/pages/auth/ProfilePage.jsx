import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import { getMe, updateMe } from '../../api/users'
import { useAuthStore } from '../../store/authStore'
import { getErrorMessage } from '../../utils/error'

export default function ProfilePage() {
  const setUser = useAuthStore((s) => s.setUser)
  const [me, setMe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, reset } = useForm()

  useEffect(() => {
    (async () => {
      try {
        const res = await getMe()
        // API-U-004 응답: { userId, email, name, role, createdAt, updatedAt }
        setMe(res.data)
        setUser({ userId: res.data.userId, name: res.data.name, role: res.data.role })
        reset({ name: res.data.name, password: '' })
      } catch (e) {
        toast.error('정보 불러오기에 실패했습니다.')
      } finally {
        setLoading(false)
      }
    })()
  }, [reset, setUser])

  const onSubmit = async (data) => {
    const payload = {}
    if (data.name && data.name !== me.name) payload.name = data.name
    if (data.password) payload.password = data.password

    if (Object.keys(payload).length === 0) {
      toast.error('수정할 데이터를 입력해주세요.')
      return
    }

    setSaving(true)
    try {
      await updateMe(payload)
      // 다시 조회해서 갱신
      const res = await getMe()
      setMe(res.data)
      setUser({ userId: res.data.userId, name: res.data.name, role: res.data.role })
      reset({ name: res.data.name, password: '' })
      toast.success('정보가 수정되었습니다.')
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-slate-500">불러오는 중...</p>
  if (!me) return null

  return (
    <div className="max-w-xl">
      <h2 className="text-2xl font-bold mb-6">내 정보</h2>

      <div className="card p-6 mb-6">
        <h3 className="font-semibold mb-4">기본 정보</h3>
        <dl className="grid grid-cols-3 gap-y-3 text-sm">
          <dt className="text-slate-500">사용자 ID</dt>
          <dd className="col-span-2">{me.userId}</dd>
          <dt className="text-slate-500">이메일</dt>
          <dd className="col-span-2">{me.email}</dd>
          <dt className="text-slate-500">권한</dt>
          <dd className="col-span-2">
            <span className={`px-2 py-0.5 rounded text-xs ${me.role === 'admin' ? 'bg-yellow-100 text-yellow-800' : 'bg-slate-100 text-slate-700'}`}>
              {me.role}
            </span>
          </dd>
          <dt className="text-slate-500">가입일</dt>
          <dd className="col-span-2">{me.createdAt ? dayjs(me.createdAt).format('YYYY-MM-DD') : '-'}</dd>
          {me.updatedAt && (
            <>
              <dt className="text-slate-500">수정일</dt>
              <dd className="col-span-2">{dayjs(me.updatedAt).format('YYYY-MM-DD HH:mm')}</dd>
            </>
          )}
        </dl>
        <p className="text-xs text-slate-400 mt-3">이메일은 변경할 수 없습니다.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4">
        <h3 className="font-semibold">정보 수정</h3>
        <div>
          <label className="label">이름</label>
          <input className="input" {...register('name')} />
        </div>
        <div>
          <label className="label">새 비밀번호 (변경 시에만 입력)</label>
          <input type="password" className="input" placeholder="8자 이상" {...register('password')} />
        </div>
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? '저장 중...' : '저장'}
        </button>
      </form>
    </div>
  )
}
