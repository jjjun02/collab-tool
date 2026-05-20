import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import { getTasks, createTask, updateTaskStatus } from '../../api/tasks'
import { getMembers, getProject } from '../../api/projects'
import Modal from '../../components/Modal'
import { getErrorMessage } from '../../utils/error'

const COLUMNS = [
  { key: 'todo', label: '할 일', bg: 'bg-status-todo', text: 'text-status-todo-text' },
  { key: 'doing', label: '진행 중', bg: 'bg-status-doing', text: 'text-status-doing-text' },
  { key: 'done', label: '완료', bg: 'bg-status-done', text: 'text-status-done-text' },
]

function TaskCard({ task, onClick }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: String(task.taskId),
    data: { task },
  })

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        if (!isDragging) onClick(task.taskId)
      }}
      className={`bg-white rounded-lg p-3 shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing hover:border-brand-300 ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex justify-between items-start gap-2">
        <h4 className="text-sm font-medium line-clamp-2">{task.title}</h4>
        {task.isOverdue && (
          <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded flex-shrink-0">기한 초과</span>
        )}
      </div>
      <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
        <span className="truncate">{task.assignee?.name || '미지정'}</span>
        {task.dueDate && <span>{dayjs(task.dueDate).format('MM/DD')}</span>}
      </div>
    </div>
  )
}

function Column({ column, tasks, onCardClick, onAddClick }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.key })
  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-xl border ${isOver ? 'border-brand-400' : 'border-slate-200'} ${column.bg} min-h-[400px]`}
    >
      <div className="flex justify-between items-center p-3 border-b border-black/5">
        <h3 className={`font-semibold text-sm ${column.text}`}>
          {column.label} ({tasks.length})
        </h3>
        <button onClick={() => onAddClick(column.key)} className="text-slate-500 hover:text-brand-600 text-lg leading-none">+</button>
      </div>
      <div className="flex flex-col gap-2 p-3 flex-1">
        {tasks.map((t) => (
          <TaskCard key={t.taskId} task={t} onClick={onCardClick} />
        ))}
        {tasks.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-4">Task가 없습니다</p>
        )}
      </div>
    </div>
  )
}

export default function KanbanBoardPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [members, setMembers] = useState([])
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [defaultStatus, setDefaultStatus] = useState('todo')
  const [assigneeFilter, setAssigneeFilter] = useState('')

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const { register, handleSubmit, reset } = useForm()

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  useEffect(() => {
    if (!loading) loadTasks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assigneeFilter])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [pRes, mRes, tRes] = await Promise.all([
        getProject(projectId),
        getMembers(projectId),
        getTasks(projectId),
      ])
      setProject(pRes.data)
      setMembers(mRes.data.members || pRes.data.members || [])
      setTasks(tRes.data.tasks || [])
    } catch (error) {
      const status = error.response?.status
      if (status === 403) {
        toast.error('프로젝트 팀원만 접근 가능합니다.')
        navigate('/projects')
      } else {
        toast.error(getErrorMessage(error, '칸반 보드를 불러올 수 없습니다.'))
      }
    } finally {
      setLoading(false)
    }
  }

  const loadTasks = async () => {
    try {
      const params = {}
      if (assigneeFilter) params.assigneeId = assigneeFilter
      const res = await getTasks(projectId, params)
      setTasks(res.data.tasks || [])
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const tasksByStatus = useMemo(() => {
    const map = { todo: [], doing: [], done: [] }
    for (const t of tasks) {
      const s = t.status || 'todo'
      if (map[s]) map[s].push(t)
    }
    return map
  }, [tasks])

  const handleDragStart = (e) => setActiveId(e.active.id)

  const handleDragEnd = async (e) => {
    setActiveId(null)
    const { active, over } = e
    if (!over) return
    const newStatus = over.id
    const taskId = Number(active.id)
    const task = tasks.find((t) => t.taskId === taskId)
    if (!task || task.status === newStatus) return

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.taskId === taskId ? { ...t, status: newStatus } : t,
      ),
    )

    try {
      await updateTaskStatus(projectId, taskId, newStatus)
    } catch (error) {
      // 롤백
      setTasks((prev) =>
        prev.map((t) =>
          t.taskId === taskId ? { ...t, status: task.status } : t,
        ),
      )
      toast.error(getErrorMessage(error, '상태 변경 실패'))
    }
  }

  const handleAddClick = (status) => {
    setDefaultStatus(status)
    reset({ title: '', description: '', assigneeId: '', dueDate: '' })
    setModalOpen(true)
  }

  const onCreateTask = async (data) => {
    try {
      const payload = {
        title: data.title,
      }
      if (data.description) payload.description = data.description
      if (data.assigneeId) payload.assigneeId = Number(data.assigneeId)
      if (data.dueDate) payload.dueDate = data.dueDate

      await createTask(projectId, payload)
      toast.success('Task가 생성되었습니다.')
      setModalOpen(false)
      await loadTasks()
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  const activeTask = activeId ? tasks.find((t) => String(t.taskId) === activeId) : null

  if (loading) return <p className="text-slate-500">불러오는 중...</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">{project?.name}</h2>
        <Link to={`/projects/${projectId}/settings`} className="text-sm text-slate-500 hover:text-brand-600">
          프로젝트 설정 →
        </Link>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 border-b border-slate-200 mb-4 text-sm">
        <Link to={`/projects/${projectId}/settings`} className="px-4 py-2 text-slate-500 hover:text-brand-600">정보</Link>
        <span className="px-4 py-2 border-b-2 border-brand-500 text-brand-600 font-medium">Task (칸반)</span>
        <Link to={`/projects/${projectId}/board`} className="px-4 py-2 text-slate-500 hover:text-brand-600">게시판</Link>
      </div>

      {/* 필터 */}
      <div className="flex gap-2 mb-4">
        <select
          className="input max-w-xs"
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
        >
          <option value="">담당자 전체</option>
          {members.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.name}
            </option>
          ))}
        </select>
        {assigneeFilter && (
          <button onClick={() => setAssigneeFilter('')} className="btn-secondary text-xs">
            필터 초기화
          </button>
        )}
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map((col) => (
            <Column
              key={col.key}
              column={col}
              tasks={tasksByStatus[col.key]}
              onCardClick={(id) => navigate(`/projects/${projectId}/tasks/${id}`)}
              onAddClick={handleAddClick}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask && (
            <div className="bg-white rounded-lg p-3 shadow-lg border border-brand-300 rotate-2">
              <h4 className="text-sm font-medium">{activeTask.title}</h4>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <Modal open={modalOpen} title="Task 생성" onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit(onCreateTask)} className="space-y-4">
          <div>
            <label className="label">제목 *</label>
            <input
              className="input"
              maxLength={300}
              {...register('title', { required: true })}
            />
          </div>
          <div>
            <label className="label">설명</label>
            <textarea rows={3} className="input resize-none" {...register('description')} />
          </div>
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
            <input type="date" className="input" {...register('dueDate')} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">취소</button>
            <button type="submit" className="btn-primary">생성</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
