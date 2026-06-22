'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import type { RoleKey } from '@/config/roles'

interface Props {
  allowedRoles: RoleKey[]
  children: React.ReactNode
  fallback?: string
}

export default function RoleGuard({ allowedRoles, children, fallback = '/portal' }: Props) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user && !allowedRoles.includes(user.perfil as RoleKey)) {
      router.replace(fallback)
    }
  }, [user, loading, allowedRoles, fallback, router])

  if (loading || !user) return null
  if (!allowedRoles.includes(user.perfil as RoleKey)) return null

  return <>{children}</>
}
