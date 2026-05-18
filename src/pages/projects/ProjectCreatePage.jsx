import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { createProject } from '../../api/projects'
import { getErrorMessage } from '../../utils/error'

export default function ProjectCreatePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const res = await createProject(data)
      const created = res.data
      const id = created.projectId || created.project_id || created.id
      toast.success(`프로젝트 생성 완료! 초대코드: ${created.inviteCode || created.invite_code}`, { duration: 5000 })
      navigate(`/projects/${id}/settings`)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl">
      <h2 className="text-2xl font-bold mb-6">새 프로젝트 만들기</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4">
        <div>
          <label className="label">프로젝트 이름 *</label>
          <input
            className="input"
            placeholder="프로젝트 이름 (최대 200자)"
            maxLength={200}
            {...register('name', { required: '프로젝트 이름을 입력해주세요.', maxLength: 200 })}
          />
          {errors.name && <p className="error-text">{errors.name.message}</p>}
        </div>
        <div>
          <label className="label">프로젝트 설명 (선택)</label>
          <textarea
            rows={4}
            className="input resize-none"
            placeholder="프로젝트 설명 (선택)"
            {...register('description')}
          />
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? '생성 중...' : '생성하기'}
          </button>
          <Link to="/projects" className="btn-secondary">취소</Link>
        </div>
      </form>
    </div>
  )
}
