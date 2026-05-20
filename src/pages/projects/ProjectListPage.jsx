import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getProjects } from '../../api/projects'

export default function ProjectListPage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const res = await getProjects()
        // API-P-002 응답: { projects: [{ projectId, name, description, myRole, createdAt }] }
        setProjects(res.data.projects || [])
      } catch (e) {
        toast.error('프로젝트 목록을 불러올 수 없습니다.')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) return <p className="text-slate-500">불러오는 중...</p>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">내 프로젝트</h2>
        <div className="flex gap-2">
          <Link to="/projects/join" className="btn-secondary">초대코드로 참여</Link>
          <Link to="/projects/new" className="btn-primary">+ 새 프로젝트</Link>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-slate-500 mb-4">아직 참여 중인 프로젝트가 없습니다.</p>
          <div className="flex justify-center gap-2">
            <Link to="/projects/new" className="btn-primary">프로젝트 만들기</Link>
            <Link to="/projects/join" className="btn-secondary">초대코드로 참여</Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <div
              key={p.projectId}
              onClick={() => navigate(`/projects/${p.projectId}/kanban`)}
              className="card p-5 cursor-pointer hover:shadow-md hover:border-brand-300 transition"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg truncate">{p.name}</h3>
                {p.myRole === 'admin' && (
                  <span className="px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-800 flex-shrink-0 ml-2">
                    admin
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 line-clamp-2 min-h-[2.5rem]">
                {p.description || '설명 없음'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
