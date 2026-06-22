'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AuthGuard from '@/components/auth/AuthGuard'
import RoleGuard from '@/components/auth/RoleGuard'
import TenantForm from '@/components/admin/TenantForm'
import { api } from '@/lib/api'
import { ROLES } from '@/config/roles'
import type { Tenant } from '@/hooks/useTenant'

export default function EditarTenantPage() {
  const { id } = useParams<{ id: string }>()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    api.get<Tenant>(`/tenants/${id}`)
      .then(setTenant)
      .finally(() => setLoading(false))
  }, [id])

  const getRoleLabel = (key: string) => ROLES.find(r => r.key === key)?.label ?? key

  return (
    <AuthGuard>
      <RoleGuard allowedRoles={['super_admin']}>
        <div className="p-8 space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar tenant</h1>
            <p className="mt-1 text-sm text-gray-500">{tenant?.nombre ?? '...'}</p>
          </div>
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-black" />
            </div>
          ) : tenant ? (
            <>
              <TenantForm tenant={tenant} />

              {/* Usuarios del tenant */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Usuarios ({tenant.users?.length ?? 0})
                  </h2>
                  <button
                    onClick={() => router.push(`/admin/usuarios?tenant_id=${tenant.id}`)}
                    className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    Ver en lista completa →
                  </button>
                </div>

                {!tenant.users || tenant.users.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
                    Este tenant no tiene usuarios registrados.
                  </p>
                ) : (
                  <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                    {tenant.users.map(user => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900">{user.nombre}</p>
                          <p className="truncate text-xs text-gray-400">{user.email}</p>
                        </div>
                        <div className="ml-4 flex shrink-0 items-center gap-3">
                          <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                            {getRoleLabel(user.perfil)}
                          </span>
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            user.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                          }`}>
                            {user.activo ? 'Activo' : 'Inactivo'}
                          </span>
                          <button
                            onClick={() => router.push(`/admin/usuarios/${user.id}`)}
                            className="text-xs text-gray-400 hover:text-gray-900 transition-colors"
                          >
                            Editar →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className="text-red-600">Tenant no encontrado.</p>
          )}
        </div>
      </RoleGuard>
    </AuthGuard>
  )
}
