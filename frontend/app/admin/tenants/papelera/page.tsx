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
import type { Tenant as BaseTenant } from '@/hooks/useTenant'

type Tenant = BaseTenant & { deleted_at: string }

export default function TenantsPapeleraPage() {
  const [tenants, setTenants]     = useState<Tenant[]>([])
  const [loading, setLoading]     = useState(true)
  const [purging, setPurging]     = useState<Tenant | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const router = useRouter()
  const { addToast } = useToast()

  async function load() {
    setLoading(true)
    const data = await api.get<Tenant[]>('/tenants/trashed')
    setTenants(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleRestore(tenant: Tenant) {
    setActionLoading(true)
    try {
      await api.post(`/tenants/${tenant.id}/restore`, {})
      addToast(`"${tenant.nombre}" restaurado correctamente`)
      await load()
    } finally {
      setActionLoading(false)
    }
  }

  async function handlePurge() {
    if (!purging) return
    setActionLoading(true)
    try {
      await api.delete(`/tenants/${purging.id}/force`)
      addToast(`"${purging.nombre}" purgado permanentemente`, 'info')
      await load()
    } finally {
      setActionLoading(false)
      setPurging(null)
    }
  }

  const columns = [
    { key: 'nombre', header: 'Nombre' },
    {
      key: 'deleted_at',
      header: 'Eliminado',
      render: (t: Tenant) => (
        <span className="text-gray-400 text-xs">
          {new Date(t.deleted_at).toLocaleDateString('es-MX', { dateStyle: 'medium' })}
        </span>
      ),
    },
    {
      key: 'acciones',
      header: '',
      render: (t: Tenant) => (
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="secondary" onClick={() => handleRestore(t)} loading={actionLoading}>
            Restaurar
          </Button>
          <Button size="sm" variant="danger" onClick={() => setPurging(t)}>
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
              <h1 className="text-2xl font-bold text-gray-900">Papelera — Tenants</h1>
              <p className="mt-1 text-sm text-gray-500">
                Tenants eliminados. Restáuralos o purgalos definitivamente.
              </p>
            </div>
            <Button variant="ghost" onClick={() => router.push('/admin/tenants')}>
              ← Volver a tenants
            </Button>
          </div>

          <Table
            columns={columns}
            data={tenants}
            keyField="id"
            loading={loading}
            emptyMessage="La papelera está vacía."
          />
        </div>

        <ConfirmDialog
          open={!!purging}
          title={`¿Purgar "${purging?.nombre}" definitivamente?`}
          description="Esta acción es irreversible. El tenant y todos sus datos serán eliminados permanentemente de la base de datos."
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
