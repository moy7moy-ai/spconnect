'use client'

import { THEME } from '@/config/theme'

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const variants = {
  primary:   'text-white hover:opacity-90',
  secondary: 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50',
  danger:    'bg-red-600 text-white hover:bg-red-700',
  ghost:     'bg-transparent text-gray-600 hover:bg-gray-100',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  disabled,
  className = '',
  style,
  ...props
}: Props) {
  const isPrimary = variant === 'primary'

  return (
    <button
      disabled={disabled || loading}
      style={isPrimary ? { backgroundColor: THEME.primaryColor, ...style } : style}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  )
}
