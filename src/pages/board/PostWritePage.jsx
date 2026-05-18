import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { createPost, getPost, updatePost } from '../../api/posts'
import ConfirmDialog from '../../components/ConfirmDialog'
import { getErrorMessage } from '../../utils/error'

export default function PostWritePage() {
  const { projectId } = useParams()
  const [searchParams] = useSearchParams()
  const editPostId = searchParams.get('edit')
  const isEdit = Boolean(editPostId)
  const navigate = useNavigate()

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm()

  useEffect(() => {
    if (!isEdit) return
    (async () => {
      try {
        const res = await getPost(projectId, editPostId)
        reset({ title: res.data.title, content: res.data.content })
      } catch (error) {
        toast.error('게시글을 불러올 수 없습니다.')
        navigate(-1)
      } finally {
        setLoading(false)
      }
    })()
  }, [editPostId, isEdit, projectId, reset, navigate])

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      if (isEdit) {
        await updatePost(projectId, editPostId, data)
        toast.success('수정되었습니다.')
        navigate(`/projects/${projectId}/posts/${editPostId}`)
      } else {
        const res = await createPost(projectId, data)
        // API-B-001 응답: { postId, title, author, createdAt }
        const newId = res.data.postId
        toast.success('게시글이 작성되었습니다.')
        navigate(`/projects/${projectId}/posts/${newId}`)
      }
    } catch (error) {
      const status = error.response?.status
      if (status === 403) toast.error('본인이 작성한 게시글만 수정할 수 있습니다.')
      else toast.error(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (isDirty) setConfirmCancel(true)
    else navigate(-1)
  }

  if (loading) return <p className="text-slate-500">불러오는 중...</p>

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-bold mb-6">{isEdit ? '게시글 수정' : '새 글 작성'}</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4">
        <div>
          <label className="label">제목 *</label>
          <input
            className="input"
            maxLength={300}
            placeholder="제목을 입력하세요"
            {...register('title', { required: '제목을 입력해주세요.' })}
          />
          {errors.title && <p className="error-text">{errors.title.message}</p>}
        </div>
        <div>
          <label className="label">내용 *</label>
          <textarea
            rows={12}
            className="input resize-none"
            placeholder="내용을 입력하세요"
            {...register('content', { required: '내용을 입력해주세요.' })}
          />
          {errors.content && <p className="error-text">{errors.content.message}</p>}
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? '저장 중...' : isEdit ? '수정' : '등록'}
          </button>
          <button type="button" onClick={handleCancel} className="btn-secondary">취소</button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmCancel}
        title="작성 취소"
        message="변경사항이 저장되지 않습니다. 정말 나가시겠습니까?"
        confirmText="나가기"
        danger
        onConfirm={() => navigate(-1)}
        onCancel={() => setConfirmCancel(false)}
      />
    </div>
  )
}
