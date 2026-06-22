'use client'

import { THEME } from '@/config/theme'

interface Props {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
}

export default function Toggle({ checked, onChange, label, disabled = false }: Props) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          disabled={disabled}
          onChange={e => onChange(e.target.checked)}
        />
        <div
          className={`h-6 w-11 rounded-full transition-colors ${disabled ? 'opacity-50' : ''}`}
          style={{ backgroundColor: checked ? THEME.primaryColor : '#D1D5DB' }}
        />
        <div
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </div>
      {label && <span className="text-sm text-gray-700">{label}</span>}
    </label>
  )
}
