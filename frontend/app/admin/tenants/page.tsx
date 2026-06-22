'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthGuard from '@/components/auth/AuthGuard'
import RoleGuard from '@/components/auth/RoleGuard'
import Table from '@/components/ui/Table'
import Button from '@/components/ui/Button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useTenants, type Tenant } from '@/hooks/useTenant'
import { api } from '@/lib/api'
import { useToast } from '@/context/ToastContext'

export default function TenantsPage() {
  const { tenants, loading, refresh } = useTenants()
  const router = useRouter()
  const { addToast } = useToast()

  const [search, setSearch]         = useState('')
  const [deleting, setDeleting]     = useState<Tenant | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const filtered = tenants.filter(t =>
    t.nombre.toLowerCase().includes(search.toLowerCase())
  )

  async function handleDelete() {
    if (!deleting) return
    setDeleteLoading(true)
    try {
      await api.delete(`/tenants/${deleting.id}`)
      addToast(`"${deleting.nombre}" enviado a la papelera`)
      await refresh()
    } finally {
      setDeleteLoading(false)
      setDeleting(null)
    }
  }

  const columns = [
    { key: 'nombre', header: 'Nombre' },
    {
      key: 'activo',
      header: 'Estado',
      render: (t: Tenant) => (
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
          t.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {t.activo ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      key: 'modulos_activos',
      header: 'Módulos activos',
      render: (t: Tenant) => {
        const activos = Object.entries(t.modulos_activos ?? {}).filter(([, v]) => v).map(([k]) => k)
        return activos.length > 0
          ? <span className="text-gray-600">{activos.join(', ')}</span>
          : <span className="text-gray-400">Ninguno</span>
      },
    },
    {
      key: 'users_count',
      header: 'Usuarios',
      render: (t: Tenant) => (
        <button
          onClick={() => router.push(`/admin/usuarios?tenant_id=${t.id}`)}
          className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors"
        >
          {t.users_count ?? 0} usuario{(t.users_count ?? 0) !== 1 ? 's' : ''}
          {(t.users_count ?? 0) > 0 && <span className="text-gray-400">→</span>}
        </button>
      ),
    },
    {
      key: 'acciones',
      header: '',
      render: (t: Tenant) => (
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="ghost" onClick={() => router.push(`/admin/tenants/${t.id}`)}>
            Editar
          </Button>
          <Button size="sm" variant="danger" onClick={() => setDeleting(t)}>
            Eliminar
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
              <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
              <p className="mt-1 text-sm text-gray-500">Empresas clientes registradas en el sistema</p>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => router.push('/admin/tenants/papelera')}>
                Papelera
              </Button>
              <Button onClick={() => router.push('/admin/tenants/nuevo')}>
                + Nuevo tenant
              </Button>
            </div>
          </div>

          <input
            type="search"
            placeholder="Buscar tenant…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-sm rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
          />

          <Table
            columns={columns}
            data={filtered}
            keyField="id"
            loading={loading}
            emptyMessage={search ? 'Sin resultados para esa búsqueda.' : 'No hay tenants registrados aún.'}
          />
        </div>

        <ConfirmDialog
          open={!!deleting}
          title={`¿Eliminar "${deleting?.nombre}"?`}
          description="El tenant pasará a la papelera. Podrás restaurarlo o purgarlo definitivamente desde allí."
          confirmLabel="Sí, eliminar"
          danger
          loading={deleteLoading}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      </RoleGuard>
    </AuthGuard>
  )
}
