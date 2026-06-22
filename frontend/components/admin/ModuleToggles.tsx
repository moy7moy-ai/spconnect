'use client'

import { MODULES } from '@/config/modules'
import Toggle from '@/components/ui/Toggle'

interface Props {
  value: Record<string, boolean>
  onChange: (value: Record<string, boolean>) => void
  disabled?: boolean
}

export default function ModuleToggles({ value, onChange, disabled = false }: Props) {
  function toggle(key: string, checked: boolean) {
    onChange({ ...value, [key]: checked })
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-700">Módulos activos</p>
      <div className="rounded-lg border border-gray-200 divide-y divide-gray-100">
        {MODULES.map(mod => (
          <div key={mod.key} className="flex items-center justify-between px-4 py-3">
            <span className="flex items-center gap-2 text-sm text-gray-700">
              <span>{mod.icon}</span>
              {mod.label}
            </span>
            <Toggle
              checked={!!value[mod.key]}
              onChange={checked => toggle(mod.key, checked)}
              disabled={disabled}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
