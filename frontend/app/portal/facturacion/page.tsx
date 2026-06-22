'use client'

import AuthGuard from '@/components/auth/AuthGuard'
import { usePermissions } from '@/hooks/usePermissions'
import { THEME } from '@/config/theme'

const MOCK_FACTURAS = [
  { folio: 'F-2026-001', fecha: '2026-06-01', concepto: 'Servicios administrados junio', monto: 15800, estatus: 'Pendiente',  fecha_pago: null },
  { folio: 'F-2026-002', fecha: '2026-05-01', concepto: 'Servicios administrados mayo',  monto: 15800, estatus: 'Pagada',     fecha_pago: '2026-05-08' },
  { folio: 'F-2026-003', fecha: '2026-04-01', concepto: 'Servicios administrados abril', monto: 14500, estatus: 'Pagada',     fecha_pago: '2026-04-10' },
  { folio: 'F-2026-004', fecha: '2026-03-01', concepto: 'Servicios administrados marzo', monto: 14500, estatus: 'Vencida',    fecha_pago: null },
]

const ESTATUS_STYLE: Record<string, string> = {
  Pendiente: 'bg-yellow-100 text-yellow-700',
  Pagada:    'bg-green-100 text-green-700',
  Vencida:   'bg-red-100 text-red-700',
}

export default function FacturacionPage() {
  const { can } = usePermissions()

  if (!can('facturacion')) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-gray-400">No tienes acceso a este módulo.</p>
      </div>
    )
  }

  const total     = MOCK_FACTURAS.reduce((s, f) => s + f.monto, 0)
  const pendiente = MOCK_FACTURAS.filter(f => f.estatus === 'Pendiente').reduce((s, f) => s + f.monto, 0)
  const vencida   = MOCK_FACTURAS.filter(f => f.estatus === 'Vencida').reduce((s, f) => s + f.monto, 0)

  return (
    <AuthGuard>
      <div className="p-6 lg:p-8 space-y-6">

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Facturación</h1>
          <p className="mt-1 text-sm text-gray-500">Historial de facturas · CONTPAQi</p>
        </div>

        {/* Indicadores */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total facturado', value: total,     color: 'text-gray-900' },
            { label: 'Por pagar',       value: pendiente, color: 'text-yellow-600' },
            { label: 'Vencido',         value: vencida,   color: 'text-red-600' },
          ].map(i => (
            <div key={i.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-gray-500">{i.label}</p>
              <p className={`mt-1 text-xl font-bold ${i.color}`}>
                ${i.value.toLocaleString('es-MX')}
              </p>
            </div>
          ))}
        </div>

        {/* Tabla */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                {['Folio', 'Fecha', 'Concepto', 'Monto', 'Estatus', 'Fecha pago', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {MOCK_FACTURAS.map(f => (
                <tr key={f.folio} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{f.folio}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(f.fecha).toLocaleDateString('es-MX')}</td>
                  <td className="px-4 py-3 text-gray-700">{f.concepto}</td>
                  <td className="px-4 py-3 font-medium">${f.monto.toLocaleString('es-MX')}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${ESTATUS_STYLE[f.estatus]}`}>
                      {f.estatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {f.fecha_pago ? new Date(f.fecha_pago).toLocaleDateString('es-MX') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="text-xs text-gray-400 hover:text-gray-700 transition-colors">PDF</button>
                      <button className="text-xs text-gray-400 hover:text-gray-700 transition-colors">XML</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Banner API */}
        <div className="rounded-xl border-l-4 bg-orange-50 px-5 py-4" style={{ borderColor: THEME.primaryColor }}>
          <p className="text-sm font-semibold" style={{ color: THEME.primaryColor }}>Datos de ejemplo</p>
          <p className="mt-0.5 text-sm text-gray-600">
            Los datos reales se cargarán una vez conectada la API de CONTPAQi en el backend.
          </p>
        </div>

      </div>
    </AuthGuard>
  )
}
