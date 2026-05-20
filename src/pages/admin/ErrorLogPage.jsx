import { Fragment, useState } from 'react'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import { getErrorLogs } from '../../api/admin'
import { getErrorMessage } from '../../utils/error'

export default function ErrorLogPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [filters, setFilters] = useState({ date: '', level: '' })
  const [expandedId, setExpandedId] = useState(null)

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.date) params.date = filters.date
      if (filters.level) params.level = filters.level
      const res = await getErrorLogs(params)
      setLogs(res.data.logs || res.data || [])
      setSearched(true)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">오류 로그</h2>

      <div className="card p-4 mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="label">날짜</label>
          <input
            type="date"
            className="input"
            value={filters.date}
            onChange={(e) => setFilters((p) => ({ ...p, date: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">레벨</label>
          <select
            className="input"
            value={filters.level}
            onChange={(e) => setFilters((p) => ({ ...p, level: e.target.value }))}
          >
            <option value="">전체</option>
            <option value="error">error</option>
            <option value="warn">warn</option>
          </select>
        </div>
        <button onClick={fetchLogs} disabled={loading} className="btn-primary">
          {loading ? '조회 중...' : '조회'}
        </button>
      </div>

      <div className="card overflow-hidden">
        {!searched ? (
          <p className="p-8 text-center text-slate-500">조회 조건을 선택하고 조회 버튼을 눌러주세요.</p>
        ) : logs.length === 0 ? (
          <p className="p-8 text-center text-slate-500">해당 조건의 로그가 없습니다.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-left">
              <tr>
                <th className="py-3 px-4 font-medium w-48">시각</th>
                <th className="py-3 px-4 font-medium w-20">레벨</th>
                <th className="py-3 px-4 font-medium">메시지</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => {
                const id = log.id || idx
                const isError = log.level === 'error'
                const expanded = expandedId === id
                return (
                  <Fragment key={id}>
                    <tr
                      onClick={() => setExpandedId(expanded ? null : id)}
                      className={`border-b border-slate-100 cursor-pointer hover:bg-slate-50 ${isError ? 'bg-red-50/40' : ''}`}
                    >
                      <td className="py-3 px-4 font-mono text-xs text-slate-600">
                        {log.timestamp ? dayjs(log.timestamp).format('YYYY-MM-DD HH:mm:ss') : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${isError ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {log.level}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-800">{log.message}</td>
                    </tr>
                    {expanded && log.stack && (
                      <tr className="bg-slate-50">
                        <td colSpan={3} className="p-4">
                          <pre className="text-xs text-slate-600 whitespace-pre-wrap overflow-x-auto">
                            {log.stack}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
