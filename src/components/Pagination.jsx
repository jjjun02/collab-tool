export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  const pages = []
  const start = Math.max(1, page - 2)
  const end = Math.min(totalPages, start + 4)
  for (let i = start; i <= end; i++) pages.push(i)

  return (
    <div className="flex justify-center items-center gap-1 mt-4">
      <button
        className="btn-secondary text-xs px-2 py-1 disabled:opacity-50"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        이전
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`text-xs px-3 py-1 rounded ${
            p === page ? 'bg-brand-500 text-white' : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
          }`}
        >
          {p}
        </button>
      ))}
      <button
        className="btn-secondary text-xs px-2 py-1 disabled:opacity-50"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        다음
      </button>
    </div>
  )
}
