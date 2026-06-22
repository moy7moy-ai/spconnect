'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, ApiError } from '@/lib/api'
import { useToast } from '@/context/ToastContext'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Toggle from '@/components/ui/Toggle'
import ModuleToggles from './ModuleToggles'
import IntegrationIdsForm, { type IntegrationEntry } from './IntegrationIdsForm'
import type { Tenant } from '@/hooks/useTenant'

interface Props {
  tenant?: Tenant
}

export default function TenantForm({ tenant }: Props) {
  const router = useRouter()
  const { addToast } = useToast()
  const isEdit = !!tenant

  const [nombre, setNombre]               = useState(tenant?.nombre ?? '')
  const [activo, setActivo]               = useState(tenant?.activo ?? true)
  const [modulos, setModulos]             = useState<Record<string, boolean>>(tenant?.modulos_activos ?? {})
  const [integrations, setIntegrations]   = useState<IntegrationEntry[]>(tenant?.integrations ?? [])
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState<string | null>(null)
  const [fieldErrors, setFieldErrors]     = useState<Record<string, string>>({})

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setFieldErrors({})
    setLoading(true)

    const payload = {
      nombre,
      activo,
      modulos_activos: modulos,
      integrations: integrations.filter(i => i.external_id.trim() !== ''),
    }

    try {
      if (isEdit) {
        await api.put(`/tenants/${tenant.id}`, payload)
        addToast('Cambios guardados correctamente')
      } else {
        await api.post('/tenants', payload)
        addToast('Tenant creado correctamente')
      }
      router.push('/admin/tenants')
      router.refresh()
    } catch (err) {
      if (err instanceof ApiError && err.fields) {
        const fe: Record<string, string> = {}
        for (const [k, msgs] of Object.entries(err.fields)) fe[k] = msgs[0]
        setFieldErrors(fe)
      } else {
        setError((err as Error).message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <Input
        label="Nombre del tenant"
        required
        value={nombre}
        onChange={e => setNombre(e.target.value)}
        placeholder="Nombre de la empresa"
        error={fieldErrors.nombre}
      />

      <Toggle
        checked={activo}
        onChange={setActivo}
        label="Tenant activo"
      />

      <ModuleToggles value={modulos} onChange={setModulos} />

      <IntegrationIdsForm
        activeModules={modulos}
        value={integrations}
        onChange={setIntegrations}
      />

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      <div className="flex gap-3">
        <Button type="submit" loading={loading}>
          {isEdit ? 'Guardar cambios' : 'Crear tenant'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
