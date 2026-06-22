'use client'

import AuthGuard from '@/components/auth/AuthGuard'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { MODULES, type ModuleKey } from '@/config/modules'

const LEVEL_BADGE: Record<string, { label: string; color: string }> = {
  full: { label: 'Acceso completo', color: 'bg-green-100 text-green-700' },
  ver:  { label: 'Solo lectura',    color: 'bg-blue-100 text-blue-700'  },
  none: { label: 'Sin acceso',      color: 'bg-gray-100 text-gray-400'  },
}

function ModuleCard({ moduleKey }: { moduleKey: ModuleKey }) {
  const { level } = usePermissions()
  const mod       = MODULES.find(m => m.key === moduleKey)!
  const perm      = level(moduleKey)
  const badge     = LEVEL_BADGE[perm]
  const accessible = perm !== 'none'

  return (
    <div className={`rounded-xl border p-6 transition-shadow ${
      accessible
        ? 'border-gray-200 bg-white shadow-sm hover:shadow-md cursor-pointer'
        : 'border-gray-100 bg-gray-50 opacity-50'
    }`}>
      <div className="flex items-start justify-between">
        <span className="text-3xl">{mod.icon}</span>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.color}`}>
          {badge.label}
        </span>
      </div>
      <h3 className="mt-4 font-semibold text-gray-900">{mod.label}</h3>
      {!accessible && (
        <p className="mt-1 text-xs text-gray-400">Contacta al administrador para solicitar acceso.</p>
      )}
    </div>
  )
}

function PortalContent() {
  const { user } = useAuth()
  const { isSuperAdmin } = usePermissions()

  const activeModules = MODULES.filter(m =>
    user?.tenant?.modulos_activos?.[m.key] === true
  )

  if (isSuperAdmin) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
        <p className="text-gray-500">Eres Super Admin. Accede al</p>
        <a href="/admin/dashboard" className="mt-2 inline-block text-sm font-semibold underline">
          Panel de administración
        </a>
      </div>
    )
  }

  if (activeModules.length === 0) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-8 text-center text-gray-400">
        Tu tenant no tiene módulos activos aún.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bienvenido, {user?.nombre}</h1>
        <p className="mt-1 text-sm text-gray-500">
          Estos son los módulos disponibles en tu cuenta.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {activeModules.map(m => (
          <ModuleCard key={m.key} moduleKey={m.key} />
        ))}
      </div>
    </div>
  )
}

export default function PortalPage() {
  return (
    <AuthGuard>
      <PortalContent />
    </AuthGuard>
  )
}
