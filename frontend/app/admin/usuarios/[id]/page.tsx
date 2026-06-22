'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import AuthGuard from '@/components/auth/AuthGuard'
import RoleGuard from '@/components/auth/RoleGuard'
import EditUserForm from '@/components/admin/EditUserForm'
import { api } from '@/lib/api'

interface User {
  id: number
  nombre: string
  email: string
  perfil: string
  permisos: Record<string, 'full' | 'ver' | 'none'>
  activo: boolean
  tenant?: { id: number; nombre: string; modulos_activos: Record<string, boolean> }
}

export default function EditarUsuarioPage() {
  const { id } = useParams<{ id: string }>()
  const [user, setUser]       = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<User>(`/users/${id}`)
      .then(setUser)
      .finally(() => setLoading(false))
  }, [id])

  return (
    <AuthGuard>
      <RoleGuard allowedRoles={['super_admin']}>
        <div className="p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar usuario</h1>
            <p className="mt-1 text-sm text-gray-500">{user?.email ?? '…'}</p>
          </div>
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-black" />
            </div>
          ) : user ? (
            <EditUserForm user={user} />
          ) : (
            <p className="text-red-600">Usuario no encontrado.</p>
          )}
        </div>
      </RoleGuard>
    </AuthGuard>
  )
}
