'use client'

import { useEffect, useState } from 'react'
import AuthGuard from '@/components/auth/AuthGuard'
import RoleGuard from '@/components/auth/RoleGuard'
import UserForm from '@/components/admin/UserForm'
import { api } from '@/lib/api'
import type { Tenant } from '@/hooks/useTenant'

export default function NuevoUsuarioPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<Tenant[]>('/tenants')
      .then(setTenants)
      .finally(() => setLoading(false))
  }, [])

  return (
    <AuthGuard>
      <RoleGuard allowedRoles={['super_admin']}>
        <div className="p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nuevo usuario</h1>
            <p className="mt-1 text-sm text-gray-500">La contraseña se genera automáticamente</p>
          </div>
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-black" />
            </div>
          ) : (
            <UserForm tenants={tenants} />
          )}
        </div>
      </RoleGuard>
    </AuthGuard>
  )
}
