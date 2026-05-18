import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import {
  getProject,
  updateProject,
  deleteProject,
  renewInviteCode,
  getMembers,
} from '../../api/projects'
import { useAuthStore } from '../../store/authStore'
import ConfirmDialog from '../../components/ConfirmDialog'
import { getErrorMessage } from '../../utils/error'

export default function ProjectDetailPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const me = useAuthStore((s) => s.user)
  const [project, setProject] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [renewing, setRenewing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const { register, handleSubmit, reset } = useForm()

  // 명세서 API-P-003 응답에 myRole 없을 수도 있어서 members[] 안의 내 정보로 판단
  // (admin이면 inviteCode가 응답에 포함되고, member면 null)
  const isAdmin = (() => {
    if (project?.myRole === 'admin' || project?.role === 'admin') return true
    if (project?.inviteCode) return true // admin만 inviteCode 받음
    const meId = me?.userId
    if (meId) {
      const myMember = members.find((m) => m.userId === meId)
      if (myMember?.role === 'admin') return true
    }
    return false
  })()

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [pRes, mRes] = await Promise.all([getProject(projectId), getMembers(projectId)])
      // API-P-003 응답에 members[]도 포함되지만, getMembers로 명시적으로도 가져옴
      setProject(pRes.data)
      setMembers(mRes.data.members || pRes.data.members || [])
      reset({ name: pRes.data.name, description: pRes.data.description || '' })
    } catch (error) {
      const status = error.response?.status
      if (status === 404) {
        toast.error('존재하지 않는 프로젝트입니다.')
        navigate('/projects')
      } else if (status === 403) {
        toast.error('해당 프로젝트 팀원이 아닙니다.')
        navigate('/projects')
      } else {
        toast.error(getErrorMessage(error))
      }
    } finally {
      setLoading(false)
    }
  }

  const onSave = async (data) => {
    setSaving(true)
    try {
      await updateProject(projectId, data)
      setProject((prev) => ({ ...prev, ...data }))
      toast.success('수정되었습니다.')
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const handleRenewInviteCode = async () => {
    setRenewing(true)
    try {
      const res = await renewInviteCode(projectId)
      // API-P-006 응답: { inviteCode }
      setProject((prev) => ({ ...prev, inviteCode: res.data.inviteCode }))
      toast.success('초대코드가 갱신되었습니다.')
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setRenewing(false)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteProject(projectId)
      toast.success('프로젝트가 삭제되었습니다.')
      navigate('/projects')
    } catch (error) {
      toast.error(getErrorMessage(error))
      setConfirmDelete(false)
    }
  }

  const copyInviteCode = () => {
    navigator.clipboard.writeText(project.inviteCode)
    toast.success('복사되었습니다.')
  }

  if (loading) return <p className="text-slate-500">불러오는 중...</p>
  if (!project) return null

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          {project.name}
          {isAdmin && <span className="px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-800">admin</span>}
        </h2>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 border-b border-slate-200 mb-6 text-sm">
        <span className="px-4 py-2 border-b-2 border-brand-500 text-brand-600 font-medium">정보</span>
        <Link to={`/projects/${projectId}/kanban`} className="px-4 py-2 text-slate-500 hover:text-brand-600">
          Task (칸반)
        </Link>
        <Link to={`/projects/${projectId}/board`} className="px-4 py-2 text-slate-500 hover:text-brand-600">
          게시판
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 기본 정보 */}
        <form onSubmit={handleSubmit(onSave)} className="card p-6 lg:col-span-2 space-y-4">
          <h3 className="font-semibold">기본 정보</h3>
          <div>
            <label className="label">프로젝트 이름</label>
            <input
              className="input"
              maxLength={200}
              disabled={!isAdmin}
              {...register('name', { required: true })}
            />
          </div>
          <div>
            <label className="label">설명</label>
            <textarea
              rows={4}
              className="input resize-none"
              disabled={!isAdmin}
              {...register('description')}
            />
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? '저장 중...' : '저장'}
              </button>
              <button type="button" onClick={() => setConfirmDelete(true)} className="btn-danger ml-auto">
                프로젝트 삭제
              </button>
            </div>
          )}
        </form>

        {/* 초대코드 */}
        <div className="card p-6 space-y-3">
          <h3 className="font-semibold">초대코드</h3>
          {isAdmin && project.inviteCode ? (
            <>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-slate-100 px-3 py-2 rounded text-sm font-mono">
                  {project.inviteCode}
                </code>
                <button onClick={copyInviteCode} className="btn-secondary text-xs">복사</button>
              </div>
              <button
                onClick={handleRenewInviteCode}
                disabled={renewing}
                className="btn-secondary w-full text-xs"
              >
                {renewing ? '갱신 중...' : '초대코드 갱신'}
              </button>
            </>
          ) : (
            <p className="text-sm text-slate-400">관리자만 확인할 수 있습니다.</p>
          )}
        </div>
      </div>

      {/* 팀원 */}
      <div className="card p-6 mt-6">
        <h3 className="font-semibold mb-4">팀원 ({members.length}명)</h3>
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500 border-b border-slate-200">
            <tr>
              <th className="py-2 font-medium">이름</th>
              <th className="py-2 font-medium">권한</th>
              <th className="py-2 font-medium">참여일</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.userId} className="border-b border-slate-100 last:border-0">
                <td className="py-2">{m.name}</td>
                <td className="py-2">
                  <span className={`px-2 py-0.5 rounded text-xs ${m.role === 'admin' ? 'bg-yellow-100 text-yellow-800' : 'bg-slate-100 text-slate-700'}`}>
                    {m.role}
                  </span>
                </td>
                <td className="py-2 text-slate-500">
                  {m.joinedAt ? dayjs(m.joinedAt).format('YYYY-MM-DD') : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="프로젝트 삭제"
        message="정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며 모든 Task와 게시글이 함께 삭제됩니다."
        confirmText="삭제"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}
