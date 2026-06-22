'use client'

interface Column<T> {
  key: string
  header: string
  render?: (row: T) => React.ReactNode
  className?: string
}

interface Props<T> {
  columns: Column<T>[]
  data: T[]
  keyField: keyof T
  emptyMessage?: string
  loading?: boolean
}

export default function Table<T>({ columns, data, keyField, emptyMessage = 'Sin resultados', loading = false }: Props<T>) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead className="border-b border-gray-200 bg-gray-50">
          <tr>
            {columns.map(col => (
              <th key={col.key} className={`px-4 py-3 text-left font-semibold text-gray-600 ${col.className ?? ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-400">
                <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-black" />
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map(row => (
              <tr key={String(row[keyField])} className="hover:bg-gray-50 transition-colors">
                {columns.map(col => (
                  <td key={col.key} className={`px-4 py-3 text-gray-700 ${col.className ?? ''}`}>
                    {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
