'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { useToast } from '@/context/ToastContext'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Toggle from '@/components/ui/Toggle'
import PermissionsMatrix from './PermissionsMatrix'
import { ROLES } from '@/config/roles'
import type { PermissionLevel } from '@/lib/permissions'
import type { Tenant } from '@/hooks/useTenant'

interface Props {
  tenants: Tenant[]
}

export default function UserForm({ tenants }: Props) {
  const router = useRouter()
  const { addToast } = useToast()

  const [tenantId, setTenantId]   = useState('')
  const [nombre, setNombre]       = useState('')
  const [email, setEmail]         = useState('')
  const [perfil, setPerfil]       = useState<string>(ROLES[1].key)
  const [permisos, setPermisos]   = useState<Record<string, PermissionLevel>>({})
  const [activo, setActivo]       = useState(true)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const selectedTenant = tenants.find(t => String(t.id) === tenantId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await api.post('/users', {
        tenant_id: Number(tenantId),
        nombre,
        email,
        perfil,
        permisos,
        activo,
      })
      addToast('Usuario creado. Las credenciales fueron enviadas por correo.')
      router.push('/admin/usuarios')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Tenant</label>
        <select
          required
          value={tenantId}
          onChange={e => setTenantId(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
        >
          <option value="">Selecciona un tenant…</option>
          {tenants.map(t => (
            <option key={t.id} value={t.id}>{t.nombre}</option>
          ))}
        </select>
      </div>

      <Input
        label="Nombre completo"
        required
        value={nombre}
        onChange={e => setNombre(e.target.value)}
        placeholder="Nombre Apellido"
      />

      <Input
        label="Correo electrónico"
        type="email"
        required
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="usuario@empresa.com"
        hint="La contraseña se generará automáticamente y se enviará a este correo"
      />

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Perfil / Rol</label>
        <select
          value={perfil}
          onChange={e => setPerfil(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
        >
          {ROLES.filter(r => r.key !== 'super_admin').map(r => (
            <option key={r.key} value={r.key}>{r.label}</option>
          ))}
        </select>
      </div>

      <PermissionsMatrix
        value={permisos}
        onChange={setPermisos}
        activeModules={selectedTenant?.modulos_activos}
      />

      <Toggle checked={activo} onChange={setActivo} label="Usuario activo" />

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      <div className="flex gap-3">
        <Button type="submit" loading={loading}>
          Crear usuario
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
