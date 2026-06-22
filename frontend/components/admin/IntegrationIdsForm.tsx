'use client'

import { MODULES } from '@/config/modules'
import Input from '@/components/ui/Input'

export interface IntegrationEntry {
  plataforma: string
  external_id: string
  activo: boolean
  metadata?: Record<string, unknown>
}

interface Props {
  activeModules: Record<string, boolean>
  value: IntegrationEntry[]
  onChange: (value: IntegrationEntry[]) => void
}

export default function IntegrationIdsForm({ activeModules, value, onChange }: Props) {
  const activeKeys = MODULES.filter(m => activeModules[m.key])

  if (activeKeys.length === 0) {
    return <p className="text-sm text-gray-400">Activa módulos para configurar sus IDs externos.</p>
  }

  function getEntry(plataforma: string): IntegrationEntry {
    return value.find(e => e.plataforma === plataforma) ?? { plataforma, external_id: '', activo: true }
  }

  function setExternalId(plataforma: string, external_id: string) {
    const existing = value.filter(e => e.plataforma !== plataforma)
    onChange([...existing, { ...getEntry(plataforma), external_id }])
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-700">IDs externos por plataforma</p>
      <div className="space-y-3">
        {activeKeys.map(mod => (
          <Input
            key={mod.key}
            label={`${mod.icon} ${mod.label} — ID externo`}
            placeholder={`ID de ${mod.label} en la plataforma externa`}
            value={getEntry(mod.key).external_id}
            onChange={e => setExternalId(mod.key, e.target.value)}
            hint="El formato depende de la plataforma (número, UUID, código, etc.)"
          />
        ))}
      </div>
    </div>
  )
}
