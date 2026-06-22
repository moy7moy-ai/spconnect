'use client'

import AuthGuard from '@/components/auth/AuthGuard'
import { usePermissions } from '@/hooks/usePermissions'
import { THEME } from '@/config/theme'

const MOCK_REPORTES = [
  { id: 1, nombre: 'Reporte Ejecutivo Mayo 2026',  periodo: 'Mayo 2026',  fecha: '2026-06-03', tipo: 'Ejecutivo', disponible: true },
  { id: 2, nombre: 'Reporte Ejecutivo Abril 2026', periodo: 'Abril 2026', fecha: '2026-05-05', tipo: 'Ejecutivo', disponible: true },
  { id: 3, nombre: 'Reporte de Incidentes Q1',     periodo: 'Q1 2026',    fecha: '2026-04-01', tipo: 'Incidentes', disponible: true },
  { id: 4, nombre: 'Reporte Ejecutivo Marzo 2026', periodo: 'Marzo 2026', fecha: '2026-04-03', tipo: 'Ejecutivo', disponible: true },
  { id: 5, nombre: 'Reporte Ejecutivo Junio 2026', periodo: 'Junio 2026', fecha: '—',          tipo: 'Ejecutivo', disponible: false },
]

export default function ReportesPage() {
  const { can } = usePermissions()

  if (!can('reportes')) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-gray-400">No tienes acceso a este módulo.</p>
      </div>
    )
  }

  return (
    <AuthGuard>
      <div className="p-6 lg:p-8 space-y-6">

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
          <p className="mt-1 text-sm text-gray-500">Reportes ejecutivos mensuales</p>
        </div>

        <div className="space-y-3">
          {MOCK_REPORTES.map(r => (
            <div
              key={r.id}
              className={`flex items-center justify-between rounded-xl border bg-white px-5 py-4 shadow-sm ${
                r.disponible ? 'border-gray-200' : 'border-gray-100 opacity-60'
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-white text-lg"
                  style={{ backgroundColor: r.disponible ? THEME.primaryColor : '#D1D5DB' }}
                >
                  📋
                </div>
                <div>
                  <p className="font-medium text-gray-900">{r.nombre}</p>
                  <p className="text-xs text-gray-400">
                    {r.tipo} · {r.disponible ? `Disponible desde ${new Date(r.fecha).toLocaleDateString('es-MX')}` : 'Próximamente'}
                  </p>
                </div>
              </div>
              {r.disponible ? (
                <button
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: THEME.primaryColor }}
                >
                  ⬇️ Descargar
                </button>
              ) : (
                <span className="text-xs text-gray-400">No disponible</span>
              )}
            </div>
          ))}
        </div>

        {/* Banner API */}
        <div className="rounded-xl border-l-4 bg-orange-50 px-5 py-4" style={{ borderColor: THEME.primaryColor }}>
          <p className="text-sm font-semibold" style={{ color: THEME.primaryColor }}>Datos de ejemplo</p>
          <p className="mt-0.5 text-sm text-gray-600">
            Los reportes reales se vincularán al configurar el almacenamiento de archivos en el backend.
          </p>
        </div>

      </div>
    </AuthGuard>
  )
}
