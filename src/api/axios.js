import axios from 'axios'
import toast from 'react-hot-toast'

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

// 요청 인터셉터: JWT 자동 첨부
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 응답 인터셉터: 공통 에러 처리 + data 자동 추출
api.interceptors.response.use(
  (res) => {
    // 백엔드 응답 포맷: { status: "success", data: {...} }
    // → res.data를 data 내용으로 자동 치환
    if (res.data && res.data.status === 'success' && res.data.data !== undefined) {
      res.data = res.data.data
    }
    return res
  },
  (error) => {
    const status = error.response?.status
    const message = error.response?.data?.message

    if (status === 401) {
      localStorage.removeItem('accessToken')
      if (!['/login', '/register'].includes(window.location.pathname)) {
        toast.error('로그인이 필요합니다.')
        window.location.href = '/login'
      }
    } else if (status === 403) {
      toast.error(message || '권한이 없습니다.')
    } else if (status === 500) {
      toast.error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    }
    return Promise.reject(error)
  },
)

export default api