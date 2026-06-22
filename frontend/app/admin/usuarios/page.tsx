'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AuthGuard from '@/components/auth/AuthGuard'
import RoleGuard from '@/components/auth/RoleGuard'
import Table from '@/components/ui/Table'
import Button from '@/components/ui/Button'
import Pagination from '@/components/ui/Pagination'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { api } from '@/lib/api'
import { useToast } from '@/context/ToastContext'
import { ROLES } from '@/config/roles'
import type { Tenant } from '@/hooks/useTenant'

interface User {
  id: number
  nombre: string
  email: string
  perfil: string
  activo: boolean
  tenant?: { id: number; nombre: string }
}

interface Paginated {
  data: User[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

function UsuariosContent() {
  const searchParams  = useSearchParams()
  const initialTenant = searchParams.get('tenant_id') ?? ''

  const [result, setResult]           = useState<Paginated | null>(null)
  const [tenants, setTenants]         = useState<Tenant[]>([])
  const [tenantFilter, setTenantFilter] = useState<string>(initialTenant)
  const [search, setSearch]           = useState('')
  const [page, setPage]               = useState(1)
  const [loading, setLoading]         = useState(true)
  const [deleting, setDeleting]       = useState<User | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const router = useRouter()
  const { addToast } = useToast()

  useEffect(() => { api.get<Tenant[]>('/tenants').then(setTenants) }, [])

  const load = useCallback(async (p = page) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p), per_page: '15' })
    if (tenantFilter) params.set('tenant_id', tenantFilter)
    if (search)       params.set('search', search)
    const data = await api.get<Paginated>(`/users?${params}`)
    setResult(data)
    setLoading(false)
  }, [page, tenantFilter, search])

  // Reset a página 1 cuando cambian filtros o búsqueda
  useEffect(() => { setPage(1) }, [tenantFilter, search])

  // Debounce de búsqueda — espera 350ms antes de llamar al backend
  useEffect(() => {
    const t = setTimeout(() => load(1), search ? 350 : 0)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => { load(page) }, [page, tenantFilter])

  async function handleDelete() {
    if (!deleting) return
    setDeleteLoading(true)
    try {
      await api.delete(`/users/${deleting.id}`)
      addToast(`"${deleting.nombre}" enviado a la papelera`)
      await load(page)
    } finally {
      setDeleteLoading(false)
      setDeleting(null)
    }
  }

  const getRoleLabel = (key: string) => ROLES.find(r => r.key === key)?.label ?? key
  const users = result?.data ?? []

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
      key: 'activo',
      header: 'Estado',
      render: (u: User) => (
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
          u.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {u.activo ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      key: 'acciones',
      header: '',
      render: (u: User) => (
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="ghost" onClick={() => router.push(`/admin/usuarios/${u.id}`)}>
            Editar
          </Button>
          <Button size="sm" variant="danger" onClick={() => setDeleting(u)}>
            Eliminar
          </Button>
        </div>
      ),
    },
  ]

  const subtitle = tenantFilter
    ? `Usuarios de: ${tenants.find(t => String(t.id) === tenantFilter)?.nombre}`
    : result
      ? `${result.total} usuario${result.total !== 1 ? 's' : ''} en total`
      : 'Cargando…'

  return (
    <AuthGuard>
      <RoleGuard allowedRoles={['super_admin']}>
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
              <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => router.push('/admin/usuarios/papelera')}>
                Papelera
              </Button>
              <Button onClick={() => router.push('/admin/usuarios/nuevo')}>
                + Nuevo usuario
              </Button>
            </div>
          </div>

          {/* Búsqueda y filtro */}
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="search"
              placeholder="Buscar por nombre o correo…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            />
            <select
              value={tenantFilter}
              onChange={e => setTenantFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            >
              <option value="">Todos los tenants</option>
              {tenants.map(t => (
                <option key={t.id} value={t.id}>{t.nombre}</option>
              ))}
            </select>
            {tenantFilter && (
              <button
                onClick={() => setTenantFilter('')}
                className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
              >
                ✕ Limpiar filtro
              </button>
            )}
          </div>

          <Table
            columns={columns}
            data={users}
            keyField="id"
            loading={loading}
            emptyMessage={
              search
                ? 'Sin resultados para esa búsqueda.'
                : tenantFilter
                  ? 'Este tenant no tiene usuarios registrados.'
                  : 'No hay usuarios registrados aún.'
            }
          />

          {result && (
            <Pagination
              currentPage={result.current_page}
              lastPage={result.last_page}
              total={result.total}
              perPage={result.per_page}
              onPage={p => setPage(p)}
            />
          )}
        </div>

        <ConfirmDialog
          open={!!deleting}
          title={`¿Eliminar a "${deleting?.nombre}"?`}
          description="El usuario pasará a la papelera. Podrás restaurarlo o purgarlo definitivamente desde allí."
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

export default function UsuariosPage() {
  return (
    <Suspense>
      <UsuariosContent />
    </Suspense>
  )
}
