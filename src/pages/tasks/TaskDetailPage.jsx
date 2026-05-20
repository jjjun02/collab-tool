import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import {
  getTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
} from '../../api/tasks'
import { getMembers } from '../../api/projects'
import ConfirmDialog from '../../components/ConfirmDialog'
import { getErrorMessage } from '../../utils/error'

const STATUS_OPTIONS = [
  { value: 'todo', label: '할 일' },
  { value: 'doing', label: '진행 중' },
  { value: 'done', label: '완료' },
]

export default function TaskDetailPage() {
  const { projectId, taskId } = useParams()
  const navigate = useNavigate()
  const [task, setTask] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const { register, handleSubmit, reset } = useForm()

  useEffect(() => {
    (async () => {
      try {
        const [tRes, mRes] = await Promise.all([
          getTask(projectId, taskId),
          getMembers(projectId),
        ])
        // API-T-003 응답: { taskId, title, description, status, assignee, dueDate, isOverdue, createdBy, createdAt, updatedAt }
        const t = tRes.data
        setTask(t)
        setMembers(mRes.data.members || [])
        reset({
          title: t.title,
          description: t.description || '',
          assigneeId: t.assignee?.userId || '',
          dueDate: t.dueDate ? dayjs(t.dueDate).format('YYYY-MM-DD') : '',
        })
      } catch (error) {
        const status = error.response?.status
        if (status === 404) {
          toast.error('존재하지 않는 Task입니다.')
          navigate(`/projects/${projectId}/kanban`)
        } else {
          toast.error(getErrorMessage(error))
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [projectId, taskId, reset, navigate])

  const onSave = async (data) => {
    setSaving(true)
    try {
      const payload = {}
      if (data.title !== undefined) payload.title = data.title
      if (data.description !== undefined) payload.description = data.description || null
      payload.assigneeId = data.assigneeId ? Number(data.assigneeId) : null
      payload.dueDate = data.dueDate || null

      await updateTask(projectId, taskId, payload)
      // 다시 조회해서 갱신
      const tRes = await getTask(projectId, taskId)
      setTask(tRes.data)
      toast.success('수정되었습니다.')
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const onStatusChange = async (e) => {
    const newStatus = e.target.value
    try {
      await updateTaskStatus(projectId, taskId, newStatus)
      setTask((prev) => ({ ...prev, status: newStatus }))
      toast.success('상태가 변경되었습니다.')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const handleDelete = async () => {
    try {
      await deleteTask(projectId, taskId)
      toast.success('삭제되었습니다.')
      navigate(`/projects/${projectId}/kanban`)
    } catch (error) {
      const status = error.response?.status
      if (status === 403) toast.error('삭제 권한이 없습니다.')
      else toast.error(getErrorMessage(error))
      setConfirmDelete(false)
    }
  }

  if (loading) return <p className="text-slate-500">불러오는 중...</p>
  if (!task) return null

  return (
    <div className="max-w-3xl">
      <button onClick={() => navigate(`/projects/${projectId}/kanban`)} className="text-sm text-slate-500 hover:text-brand-600 mb-4">
        ← 칸반 보드로
      </button>

      {task.isOverdue && (
        <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm mb-4">
          ⚠️ 이 Task는 기한이 초과되었습니다.
        </div>
      )}

      <form onSubmit={handleSubmit(onSave)} className="card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <input
            className="input flex-1 text-lg font-semibold"
            {...register('title', { required: true })}
            maxLength={300}
          />
          <select
            className="input w-auto"
            value={task.status}
            onChange={onStatusChange}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">설명</label>
          <textarea rows={5} className="input resize-none" {...register('description')} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">담당자</label>
            <select className="input" {...register('assigneeId')}>
              <option value="">미지정</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">마감일</label>
            <input
              type="date"
              className={`input ${task.isOverdue ? 'text-red-600' : ''}`}
              {...register('dueDate')}
            />
          </div>
        </div>

        <div className="text-xs text-slate-500 border-t border-slate-100 pt-3 space-y-1">
          <p>작성자: {task.createdBy?.name || '-'}</p>
          <p>작성일: {task.createdAt ? dayjs(task.createdAt).format('YYYY-MM-DD HH:mm') : '-'}</p>
          {task.updatedAt && <p>수정일: {dayjs(task.updatedAt).format('YYYY-MM-DD HH:mm')}</p>}
        </div>

        <div className="flex gap-2 pt-2">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? '저장 중...' : '저장'}
          </button>
          <button type="button" onClick={() => setConfirmDelete(true)} className="btn-danger ml-auto">
            삭제
          </button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmDelete}
        title="Task 삭제"
        message="정말 삭제하시겠습니까?"
        confirmText="삭제"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}
