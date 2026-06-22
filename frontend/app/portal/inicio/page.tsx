'use client'

import { useRouter } from 'next/navigation'
import AuthGuard from '@/components/auth/AuthGuard'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { THEME } from '@/config/theme'

interface KPICard {
  label: string
  value: string | number
  sub?: string
  color?: string
  href?: string
  icon: string
}

function KPI({ label, value, sub, color, href, icon }: KPICard) {
  const router = useRouter()
  return (
    <div
      onClick={() => href && router.push(href)}
      className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow ${
        href ? 'cursor-pointer hover:shadow-md' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        {color && <span className={`h-2 w-2 rounded-full ${color}`} />}
      </div>
      <p className="mt-3 text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm font-medium text-gray-600">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

function QuickAction({ icon, label, href }: { icon: string; label: string; href: string }) {
  const router = useRouter()
  return (
    <button
      onClick={() => router.push(href)}
      className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm hover:shadow-md hover:border-gray-300 transition-all"
    >
      <span className="text-lg">{icon}</span>
      {label}
    </button>
  )
}

export default function InicioPage() {
  const { user } = useAuth()
  const { can } = usePermissions()

  return (
    <AuthGuard>
      <div className="p-6 lg:p-8 space-y-8">

        {/* Bienvenida */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bienvenido, {user?.nombre?.split(' ')[0]}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Resumen de servicios administrados · {new Date().toLocaleDateString('es-MX', { dateStyle: 'long' })}
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {can('facturacion') && (
            <>
              <KPI
                icon="📄"
                label="Facturas pendientes"
                value="—"
                sub="Pendiente de conexión CONTPAQi"
                color="bg-yellow-400"
                href="/portal/facturacion"
              />
              <KPI
                icon="✅"
                label="Facturas pagadas"
                value="—"
                sub="Este mes"
                color="bg-green-400"
                href="/portal/facturacion"
              />
            </>
          )}
          {can('tickets') && (
            <>
              <KPI
                icon="🔴"
                label="Tickets abiertos"
                value="—"
                sub="Pendiente de conexión OTRS"
                color="bg-red-400"
                href="/portal/tickets"
              />
              <KPI
                icon="✔️"
                label="Tickets cerrados"
                value="—"
                sub="Últimos 30 días"
                color="bg-gray-300"
                href="/portal/tickets"
              />
            </>
          )}
          {can('reportes') && (
            <KPI
              icon="📊"
              label="Reportes disponibles"
              value="—"
              sub="Pendiente de conexión"
              href="/portal/reportes"
            />
          )}
          <KPI
            icon="🟢"
            label="Estado general"
            value="Operativo"
            sub="Todos los servicios activos"
            color="bg-green-400"
          />
        </div>

        {/* Accesos rápidos */}
        <div>
          <h2 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wider">
            Accesos rápidos
          </h2>
          <div className="flex flex-wrap gap-3">
            {can('tickets') && (
              <QuickAction icon="🎫" label="Abrir ticket" href="/portal/tickets?nuevo=1" />
            )}
            {can('facturacion') && (
              <QuickAction icon="⬇️" label="Descargar factura" href="/portal/facturacion" />
            )}
            {can('reportes') && (
              <QuickAction icon="📋" label="Último reporte" href="/portal/reportes" />
            )}
          </div>
        </div>

        {/* Banner de configuración pendiente */}
        <div
          className="rounded-xl border-l-4 bg-orange-50 px-5 py-4"
          style={{ borderColor: THEME.primaryColor }}
        >
          <p className="text-sm font-semibold" style={{ color: THEME.primaryColor }}>
            Configuración pendiente
          </p>
          <p className="mt-0.5 text-sm text-gray-600">
            Los KPIs mostrarán datos reales una vez conectadas las APIs de CONTPAQi, OTRS y Zabbix.
          </p>
        </div>

      </div>
    </AuthGuard>
  )
}
