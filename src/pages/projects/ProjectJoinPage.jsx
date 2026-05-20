import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { joinProject } from '../../api/projects'
import { getErrorMessage } from '../../utils/error'

export default function ProjectJoinPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, setError, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const res = await joinProject(data.inviteCode.trim())
      const projectId = res.data.projectId || res.data.project_id
      const projectName = res.data.name || res.data.projectName
      toast.success(`${projectName || '프로젝트'}에 참여했습니다!`)
      navigate(`/projects/${projectId}/kanban`)
    } catch (error) {
      const status = error.response?.status
      if (status === 400) {
        setError('inviteCode', { message: '유효하지 않은 초대코드입니다.' })
      } else if (status === 409) {
        setError('inviteCode', { message: '이미 참여 중인 프로젝트입니다.' })
      } else if (status === 404) {
        setError('inviteCode', { message: '존재하지 않는 프로젝트입니다.' })
      } else {
        toast.error(getErrorMessage(error))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md">
      <h2 className="text-2xl font-bold mb-6">초대코드로 참여</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4">
        <div>
          <label className="label">초대코드</label>
          <input
            className="input"
            placeholder="초대코드를 입력하세요"
            {...register('inviteCode', { required: '초대코드를 입력해주세요.' })}
          />
          {errors.inviteCode && <p className="error-text">{errors.inviteCode.message}</p>}
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? '참여 중...' : '참여하기'}
          </button>
          <Link to="/projects" className="btn-secondary">취소</Link>
        </div>
      </form>
    </div>
  )
}
