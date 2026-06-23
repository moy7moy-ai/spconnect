'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, ApiError } from '@/lib/api'
import { useToast } from '@/context/ToastContext'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import PermissionsMatrix from './PermissionsMatrix'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { ROLES } from '@/config/roles'
import type { PermissionLevel } from '@/lib/permissions'

interface User {
  id: number
  nombre: string
  email: string
  perfil: string
  permisos: Record<string, PermissionLevel>
  activo: boolean
  tenant?: { id: number; nombre: string; modulos_activos: Record<string, boolean> }
}

export default function EditUserForm({ user }: { user: User }) {
  const router = useRouter()
  const { addToast } = useToast()

  const [nombre, setNombre]   = useState(user.nombre)
  const [perfil, setPerfil]   = useState(user.perfil)
  const [permisos, setPermisos] = useState<Record<string, PermissionLevel>>(user.permisos ?? {})
  const [activo, setActivo]   = useState(user.activo)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors]   = useState<Record<string, string>>({})
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen]           = useState(false)
  const [confirmLoading, setConfirmLoading]     = useState(false)
  const [resetOpen, setResetOpen]               = useState(false)
  const [resetLoading, setResetLoading]         = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})
    setGlobalError(null)
    setLoading(true)
    try {
      await api.patch(`/users/${user.id}`, { nombre, perfil, permisos, activo })
      addToast('Usuario actualizado correctamente')
      router.push('/admin/usuarios')
      router.refresh()
    } catch (err) {
      if (err instanceof ApiError && err.fields) {
        const fieldErrors: Record<string, string> = {}
        for (const [key, msgs] of Object.entries(err.fields)) {
          fieldErrors[key] = msgs[0]
        }
        setErrors(fieldErrors)
      } else {
        setGlobalError((err as Error).message)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword() {
    setResetLoading(true)
    try {
      await api.post(`/users/${user.id}/reset-password`, {})
      addToast('Nueva contraseña enviada al correo del usuario')
    } catch (err) {
      setGlobalError((err as Error).message)
    } finally {
      setResetLoading(false)
      setResetOpen(false)
    }
  }

  async function handleToggleActivo() {
    setConfirmLoading(true)
    try {
      await api.patch(`/users/${user.id}`, { activo: !activo })
      const next = !activo
      setActivo(next)
      addToast(next ? 'Usuario activado' : 'Usuario desactivado')
    } catch (err) {
      setGlobalError((err as Error).message)
    } finally {
      setConfirmLoading(false)
      setConfirmOpen(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
          <span className="font-medium text-gray-700">Correo:</span> {user.email}
          {user.tenant && (
            <span className="ml-4">
              <span className="font-medium text-gray-700">Tenant:</span> {user.tenant.nombre}
            </span>
          )}
        </div>

        <Input
          label="Nombre completo"
          required
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          error={errors.nombre}
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
          {errors.perfil && <p className="text-xs text-red-600">{errors.perfil}</p>}
        </div>

        <PermissionsMatrix
          value={permisos}
          onChange={setPermisos}
          activeModules={user.tenant?.modulos_activos}
        />

        <div className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-gray-700">Contraseña</p>
            <p className="text-xs text-gray-400">
              Genera una nueva contraseña aleatoria y la envía al correo del usuario
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setResetOpen(true)}
          >
            Resetear contraseña
          </Button>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-gray-700">Estado de la cuenta</p>
            <p className="text-xs text-gray-400">
              {activo ? 'El usuario puede iniciar sesión' : 'El usuario no puede iniciar sesión'}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant={activo ? 'danger' : 'secondary'}
            onClick={() => setConfirmOpen(true)}
          >
            {activo ? 'Desactivar' : 'Activar'}
          </Button>
        </div>

        {globalError && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{globalError}</p>
        )}

        <div className="flex gap-3">
          <Button type="submit" loading={loading}>Guardar cambios</Button>
          <Button type="button" variant="ghost" onClick={() => router.back()}>Cancelar</Button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmOpen}
        title={activo ? '¿Desactivar usuario?' : '¿Activar usuario?'}
        description={
          activo
            ? 'El usuario no podrá iniciar sesión hasta que se reactive.'
            : 'El usuario podrá iniciar sesión nuevamente.'
        }
        confirmLabel={activo ? 'Sí, desactivar' : 'Sí, activar'}
        danger={activo}
        loading={confirmLoading}
        onConfirm={handleToggleActivo}
        onCancel={() => setConfirmOpen(false)}
      />

      <ConfirmDialog
        open={resetOpen}
        title="¿Resetear contraseña?"
        description={`Se generará una nueva contraseña aleatoria y se enviará al correo de ${user.email}. La contraseña actual dejará de funcionar inmediatamente.`}
        confirmLabel="Sí, resetear y enviar"
        loading={resetLoading}
        onConfirm={handleResetPassword}
        onCancel={() => setResetOpen(false)}
      />
    </>
  )
}
