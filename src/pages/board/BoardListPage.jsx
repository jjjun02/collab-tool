import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import { getPosts } from '../../api/posts'
import { getProject } from '../../api/projects'
import Pagination from '../../components/Pagination'
import { getErrorMessage } from '../../utils/error'

export default function BoardListPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') || 1)
  const size = 10

  const [project, setProject] = useState(null)
  const [posts, setPosts] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const pRes = await getProject(projectId)
        setProject(pRes.data)
      } catch (e) {
        // ignore
      }
    })()
  }, [projectId])

  useEffect(() => {
    loadPosts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, projectId])

  const loadPosts = async () => {
    setLoading(true)
    try {
      const res = await getPosts(projectId, page, size)
      // API-B-002 응답: { posts: [...], totalCount, totalPages, currentPage }
      setPosts(res.data.posts || [])
      setTotalCount(res.data.totalCount || 0)
      setTotalPages(res.data.totalPages || 1)
    } catch (error) {
      const status = error.response?.status
      if (status === 403) toast.error('접근 권한이 없습니다.')
      else toast.error(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">{project?.name}</h2>
        <Link to={`/projects/${projectId}/settings`} className="text-sm text-slate-500 hover:text-brand-600">
          프로젝트 설정 →
        </Link>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 border-b border-slate-200 mb-6 text-sm">
        <Link to={`/projects/${projectId}/settings`} className="px-4 py-2 text-slate-500 hover:text-brand-600">정보</Link>
        <Link to={`/projects/${projectId}/kanban`} className="px-4 py-2 text-slate-500 hover:text-brand-600">Task (칸반)</Link>
        <span className="px-4 py-2 border-b-2 border-brand-500 text-brand-600 font-medium">게시판</span>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">게시글 ({totalCount}개)</h3>
        <Link to={`/projects/${projectId}/board/new`} className="btn-primary">새 글 작성</Link>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-slate-500">불러오는 중...</p>
        ) : posts.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-500 mb-3">게시글이 없습니다. 첫 글을 작성해보세요!</p>
            <Link to={`/projects/${projectId}/board/new`} className="btn-primary">새 글 작성</Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="w-12 py-3 px-4 text-left font-medium">No</th>
                <th className="py-3 px-4 text-left font-medium">제목</th>
                <th className="w-32 py-3 px-4 text-left font-medium">작성자</th>
                <th className="w-28 py-3 px-4 text-left font-medium">작성일</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p, idx) => (
                <tr
                  key={p.postId}
                  onClick={() => navigate(`/projects/${projectId}/posts/${p.postId}`)}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer"
                >
                  <td className="py-3 px-4 text-slate-500">{totalCount - ((page - 1) * size) - idx}</td>
                  <td className="py-3 px-4 font-medium">{p.title}</td>
                  <td className="py-3 px-4 text-slate-600">{p.author?.name || '-'}</td>
                  <td className="py-3 px-4 text-slate-500">
                    {p.createdAt ? dayjs(p.createdAt).format('YYYY-MM-DD') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={(p) => setSearchParams({ page: String(p) })}
      />
    </div>
  )
}
