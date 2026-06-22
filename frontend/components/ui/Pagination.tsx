'use client'

interface Props {
  currentPage: number
  lastPage: number
  total: number
  perPage: number
  onPage: (page: number) => void
}

export default function Pagination({ currentPage, lastPage, total, perPage, onPage }: Props) {
  if (lastPage <= 1) return null

  const from = (currentPage - 1) * perPage + 1
  const to   = Math.min(currentPage * perPage, total)

  const pages: (number | '...')[] = []
  if (lastPage <= 7) {
    for (let i = 1; i <= lastPage; i++) pages.push(i)
  } else {
    pages.push(1)
    if (currentPage > 3) pages.push('...')
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(lastPage - 1, currentPage + 1); i++) {
      pages.push(i)
    }
    if (currentPage < lastPage - 2) pages.push('...')
    pages.push(lastPage)
  }

  return (
    <div className="flex items-center justify-between pt-2">
      <p className="text-xs text-gray-400">
        Mostrando {from}–{to} de {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="rounded-lg px-2.5 py-1.5 text-sm text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ←
        </button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="px-1 text-sm text-gray-300">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p as number)}
              className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                p === currentPage
                  ? 'bg-gray-900 text-white font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPage(currentPage + 1)}
          disabled={currentPage === lastPage}
          className="rounded-lg px-2.5 py-1.5 text-sm text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          →
        </button>
      </div>
    </div>
  )
}
