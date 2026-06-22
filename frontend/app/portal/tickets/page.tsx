'use client'

import { useState } from 'react'
import AuthGuard from '@/components/auth/AuthGuard'
import { usePermissions } from '@/hooks/usePermissions'
import { THEME } from '@/config/theme'

const MOCK_TICKETS = [
  { id: 'TK-1042', asunto: 'Lentitud en acceso VPN', fecha: '2026-06-20', prioridad: 'Alta',   estatus: 'Abierto',    fuente: 'OTRS',    ultima_act: '2026-06-21' },
  { id: 'TK-1041', asunto: 'Switch Meraki sin conexión',  fecha: '2026-06-18', prioridad: 'Crítica', estatus: 'En proceso', fuente: 'Meraki',  ultima_act: '2026-06-20' },
  { id: 'TK-1038', asunto: 'Alerta CPU servidor web',    fecha: '2026-06-15', prioridad: 'Media',  estatus: 'En proceso', fuente: 'Zabbix',  ultima_act: '2026-06-17' },
  { id: 'TK-1035', asunto: 'Solicitud nuevo usuario AD',  fecha: '2026-06-10', prioridad: 'Baja',   estatus: 'Cerrado',    fuente: 'OTRS',    ultima_act: '2026-06-12' },
  { id: 'TK-1030', asunto: 'Renovación certificado SSL',  fecha: '2026-06-05', prioridad: 'Media',  estatus: 'Cerrado',    fuente: 'OTRS',    ultima_act: '2026-06-07' },
]

const PRIORIDAD_STYLE: Record<string, string> = {
  Crítica: 'bg-red-100 text-red-700',
  Alta:    'bg-orange-100 text-orange-700',
  Media:   'bg-yellow-100 text-yellow-700',
  Baja:    'bg-gray-100 text-gray-500',
}

const ESTATUS_STYLE: Record<string, string> = {
  'Abierto':    'bg-blue-100 text-blue-700',
  'En proceso': 'bg-yellow-100 text-yellow-700',
  'Cerrado':    'bg-green-100 text-green-700',
}

const FUENTE_STYLE: Record<string, string> = {
  OTRS:   'bg-purple-100 text-purple-600',
  Zabbix: 'bg-red-100 text-red-600',
  Meraki: 'bg-teal-100 text-teal-600',
}

export default function TicketsPage() {
  const { can, canEdit } = usePermissions()
  const [filtro, setFiltro] = useState<'todos' | 'abiertos' | 'cerrados'>('todos')

  if (!can('tickets')) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-gray-400">No tienes acceso a este módulo.</p>
      </div>
    )
  }

  const filtered = MOCK_TICKETS.filter(t =>
    filtro === 'todos'    ? true :
    filtro === 'abiertos' ? t.estatus !== 'Cerrado' :
    t.estatus === 'Cerrado'
  )

  return (
    <AuthGuard>
      <div className="p-6 lg:p-8 space-y-6">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Soporte</h1>
            <p className="mt-1 text-sm text-gray-500">Tickets · OTRS · Zabbix · Meraki</p>
          </div>
          {canEdit('tickets') && (
            <button
              className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: THEME.primaryColor }}
            >
              + Abrir ticket
            </button>
          )}
        </div>

        {/* Filtros rápidos */}
        <div className="flex gap-2">
          {(['todos', 'abiertos', 'cerrados'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                filtro === f
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={filtro === f ? { backgroundColor: THEME.primaryColor } : {}}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Tabla */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                {['Ticket', 'Asunto', 'Fuente', 'Prioridad', 'Estatus', 'Última act.', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(t => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors cursor-pointer">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700">{t.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{t.asunto}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${FUENTE_STYLE[t.fuente]}`}>
                      {t.fuente}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${PRIORIDAD_STYLE[t.prioridad]}`}>
                      {t.prioridad}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${ESTATUS_STYLE[t.estatus]}`}>
                      {t.estatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(t.ultima_act).toLocaleDateString('es-MX')}
                  </td>
                  <td className="px-4 py-3">
                    <button className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
                      Ver →
                    </button>
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
            Los tickets reales se cargarán al conectar OTRS, Zabbix y Meraki en el backend.
          </p>
        </div>

      </div>
    </AuthGuard>
  )
}
