import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import {
  getPost,
  deletePost,
  createComment,
  deleteComment,
} from '../../api/posts'
import { useAuthStore } from '../../store/authStore'
import ConfirmDialog from '../../components/ConfirmDialog'
import { getErrorMessage } from '../../utils/error'

export default function PostDetailPage() {
  const { projectId, postId } = useParams()
  const navigate = useNavigate()
  const me = useAuthStore((s) => s.user)
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    loadPost()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, postId])

  const loadPost = async () => {
    setLoading(true)
    try {
      const res = await getPost(projectId, postId)
      // API-B-003 응답: { postId, title, content, author, createdAt, updatedAt, comments[] }
      setPost(res.data)
      setComments(res.data.comments || [])
    } catch (error) {
      const status = error.response?.status
      if (status === 404) {
        toast.error('존재하지 않는 게시글입니다.')
        navigate(`/projects/${projectId}/board`)
      } else {
        toast.error(getErrorMessage(error))
      }
    } finally {
      setLoading(false)
    }
  }

  const onSubmitComment = async (data) => {
    setSubmitting(true)
    try {
      await createComment(projectId, postId, data.content)
      reset({ content: '' })
      await loadPost()
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return
    try {
      await deleteComment(projectId, postId, commentId)
      setComments((prev) => prev.filter((c) => c.commentId !== commentId))
    } catch (error) {
      const status = error.response?.status
      if (status === 403) toast.error('권한이 없습니다.')
      else toast.error(getErrorMessage(error))
    }
  }

  const handleDeletePost = async () => {
    try {
      await deletePost(projectId, postId)
      toast.success('삭제되었습니다.')
      navigate(`/projects/${projectId}/board`)
    } catch (error) {
      const status = error.response?.status
      if (status === 403) toast.error('권한이 없습니다.')
      else toast.error(getErrorMessage(error))
      setConfirmDelete(false)
    }
  }

  if (loading) return <p className="text-slate-500">불러오는 중...</p>
  if (!post) return null

  const authorId = post.author?.userId
  const meId = me?.userId
  const isAuthor = meId && authorId && meId === authorId
  const isAdmin = me?.role === 'admin'

  return (
    <div className="max-w-3xl">
      <button onClick={() => navigate(`/projects/${projectId}/board`)} className="text-sm text-slate-500 hover:text-brand-600 mb-4">
        ← 게시판으로
      </button>

      <article className="card p-6 mb-6">
        <header className="border-b border-slate-100 pb-4 mb-4">
          <h1 className="text-2xl font-bold mb-2">{post.title}</h1>
          <div className="flex justify-between items-center text-sm text-slate-500">
            <span>{post.author?.name || '-'}</span>
            <div className="flex items-center gap-3">
              <span>{post.createdAt ? dayjs(post.createdAt).format('YYYY-MM-DD HH:mm') : '-'}</span>
              {post.updatedAt && post.updatedAt !== post.createdAt && (
                <span className="text-xs">(수정: {dayjs(post.updatedAt).format('YYYY-MM-DD HH:mm')})</span>
              )}
            </div>
          </div>
        </header>
        <div className="prose max-w-none whitespace-pre-wrap text-slate-800 leading-relaxed">
          {post.content}
        </div>
        {(isAuthor || isAdmin) && (
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
            {isAuthor && (
              <button
                onClick={() => navigate(`/projects/${projectId}/board/new?edit=${postId}`)}
                className="btn-secondary text-sm"
              >
                수정
              </button>
            )}
            <button onClick={() => setConfirmDelete(true)} className="btn-danger text-sm">
              삭제
            </button>
          </div>
        )}
      </article>

      {/* 댓글 영역 */}
      <section className="card p-6">
        <h3 className="font-semibold mb-4">댓글 ({comments.length})</h3>

        <form onSubmit={handleSubmit(onSubmitComment)} className="mb-6 space-y-2">
          <textarea
            rows={3}
            className="input resize-none"
            placeholder="댓글을 입력하세요"
            {...register('content', { required: '댓글 내용을 입력해주세요.' })}
          />
          {errors.content && <p className="error-text">{errors.content.message}</p>}
          <div className="flex justify-end">
            <button type="submit" disabled={submitting} className="btn-primary text-sm">
              {submitting ? '등록 중...' : '등록'}
            </button>
          </div>
        </form>

        <ul className="space-y-3">
          {comments.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-4">아직 댓글이 없습니다.</p>
          )}
          {comments.map((c) => {
            const cAuthorId = c.author?.userId
            const canDelete = (meId && cAuthorId === meId) || isAdmin
            return (
              <li key={c.commentId} className="border-b border-slate-100 last:border-0 pb-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1">{c.author?.name || '-'}</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{c.content}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {c.createdAt ? dayjs(c.createdAt).format('YYYY-MM-DD HH:mm') : ''}
                    </p>
                  </div>
                  {canDelete && (
                    <button
                      onClick={() => handleDeleteComment(c.commentId)}
                      className="text-xs text-slate-400 hover:text-red-500"
                    >
                      삭제
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <ConfirmDialog
        open={confirmDelete}
        title="게시글 삭제"
        message="정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        confirmText="삭제"
        danger
        onConfirm={handleDeletePost}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}
