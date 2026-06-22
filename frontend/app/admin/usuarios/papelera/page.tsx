'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AuthGuard from '@/components/auth/AuthGuard'
import RoleGuard from '@/components/auth/RoleGuard'
import Table from '@/components/ui/Table'
import Button from '@/components/ui/Button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { api } from '@/lib/api'
import { useToast } from '@/context/ToastContext'
import { ROLES } from '@/config/roles'

interface User {
  id: number
  nombre: string
  email: string
  perfil: string
  deleted_at: string
  tenant?: { nombre: string }
}

export default function UsuariosPapeleraPage() {
  const [users, setUsers]         = useState<User[]>([])
  const [loading, setLoading]     = useState(true)
  const [purging, setPurging]     = useState<User | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const router = useRouter()
  const { addToast } = useToast()

  async function load() {
    setLoading(true)
    const data = await api.get<User[]>('/users/trashed')
    setUsers(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleRestore(user: User) {
    setActionLoading(true)
    try {
      await api.post(`/users/${user.id}/restore`, {})
      addToast(`"${user.nombre}" restaurado correctamente`)
      await load()
    } finally {
      setActionLoading(false)
    }
  }

  async function handlePurge() {
    if (!purging) return
    setActionLoading(true)
    try {
      await api.delete(`/users/${purging.id}/force`)
      addToast(`"${purging.nombre}" purgado permanentemente`, 'info')
      await load()
    } finally {
      setActionLoading(false)
      setPurging(null)
    }
  }

  const getRoleLabel = (key: string) => ROLES.find(r => r.key === key)?.label ?? key

  const columns = [
    { key: 'nombre', header: 'Nombre' },
    { key: 'email',  header: 'Correo' },
    {
      key: 'tenant',
      header: 'Tenant',
      render: (u: User) => <span className="text-gray-600">{u.tenant?.nombre ?? '—'}</span>,
    },
    {
      key: 'perfil',
      header: 'Perfil',
      render: (u: User) => (
        <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
          {getRoleLabel(u.perfil)}
        </span>
      ),
    },
    {
      key: 'deleted_at',
      header: 'Eliminado',
      render: (u: User) => (
        <span className="text-gray-400 text-xs">
          {new Date(u.deleted_at).toLocaleDateString('es-MX', { dateStyle: 'medium' })}
        </span>
      ),
    },
    {
      key: 'acciones',
      header: '',
      render: (u: User) => (
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="secondary" onClick={() => handleRestore(u)} loading={actionLoading}>
            Restaurar
          </Button>
          <Button size="sm" variant="danger" onClick={() => setPurging(u)}>
            Purgar
          </Button>
        </div>
      ),
    },
  ]

  return (
    <AuthGuard>
      <RoleGuard allowedRoles={['super_admin']}>
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Papelera — Usuarios</h1>
              <p className="mt-1 text-sm text-gray-500">
                Usuarios eliminados. Restáuralos o purgalos definitivamente.
              </p>
            </div>
            <Button variant="ghost" onClick={() => router.push('/admin/usuarios')}>
              ← Volver a usuarios
            </Button>
          </div>

          <Table
            columns={columns}
            data={users}
            keyField="id"
            loading={loading}
            emptyMessage="La papelera está vacía."
          />
        </div>

        <ConfirmDialog
          open={!!purging}
          title={`¿Purgar a "${purging?.nombre}" definitivamente?`}
          description="Esta acción es irreversible. El usuario será eliminado permanentemente de la base de datos."
          confirmLabel="Sí, purgar para siempre"
          danger
          loading={actionLoading}
          onConfirm={handlePurge}
          onCancel={() => setPurging(null)}
        />
      </RoleGuard>
    </AuthGuard>
  )
}
