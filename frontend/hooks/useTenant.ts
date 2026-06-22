'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

export interface TenantUser {
  id: number
  nombre: string
  email: string
  perfil: string
  activo: boolean
}

export interface Tenant {
  id: number
  nombre: string
  activo: boolean
  modulos_activos: Record<string, boolean>
  users_count?: number
  users?: TenantUser[]
  integrations?: Integration[]
}

export interface Integration {
  id: number
  plataforma: string
  external_id: string
  activo: boolean
  metadata?: Record<string, unknown>
}

export function useTenants() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.get<Tenant[]>('/tenants')
      setTenants(data)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return { tenants, loading, error, refresh: load }
}
