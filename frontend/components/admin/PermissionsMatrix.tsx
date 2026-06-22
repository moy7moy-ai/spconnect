'use client'

import { MODULES } from '@/config/modules'
import type { PermissionLevel } from '@/lib/permissions'

interface Props {
  value: Record<string, PermissionLevel>
  onChange: (value: Record<string, PermissionLevel>) => void
  activeModules?: Record<string, boolean>
}

const LEVELS: { key: PermissionLevel; label: string }[] = [
  { key: 'full', label: 'Completo' },
  { key: 'ver',  label: 'Solo ver' },
  { key: 'none', label: 'Sin acceso' },
]

export default function PermissionsMatrix({ value, onChange, activeModules }: Props) {
  const visibleModules = activeModules
    ? MODULES.filter(m => activeModules[m.key])
    : MODULES

  function setLevel(moduleKey: string, level: PermissionLevel) {
    onChange({ ...value, [moduleKey]: level })
  }

  if (visibleModules.length === 0) {
    return <p className="text-sm text-gray-400">Activa al menos un módulo para configurar permisos.</p>
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-700">Permisos por módulo</p>
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium text-gray-600">Módulo</th>
              {LEVELS.map(l => (
                <th key={l.key} className="px-4 py-2.5 text-center font-medium text-gray-600">
                  {l.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visibleModules.map(mod => (
              <tr key={mod.key} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-700">
                  <span className="mr-2">{mod.icon}</span>{mod.label}
                </td>
                {LEVELS.map(l => (
                  <td key={l.key} className="px-4 py-3 text-center">
                    <input
                      type="radio"
                      name={`perm-${mod.key}`}
                      value={l.key}
                      checked={(value[mod.key] ?? 'none') === l.key}
                      onChange={() => setLevel(mod.key, l.key)}
                      className="h-4 w-4 accent-black"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
