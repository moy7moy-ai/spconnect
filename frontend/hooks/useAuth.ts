'use client'

import { useState, useEffect, useCallback } from 'react'
import { getMe, logout as authLogout, isLoggedIn, type AuthUser } from '@/lib/auth'

const TOKEN_CHECK_INTERVAL = 5 * 60 * 1000 // 5 minutos

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const loadUser = useCallback(async () => {
    if (!isLoggedIn()) {
      setLoading(false)
      return
    }
    try {
      const me = await getMe()
      setUser(me)
    } catch {
      localStorage.removeItem('auth_token')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadUser() }, [loadUser])

  // Verifica el token cada 5 minutos — si expiró, api.ts dispara auto-logout al recibir 401
  useEffect(() => {
    if (!isLoggedIn()) return
    const interval = setInterval(() => {
      if (isLoggedIn()) getMe().catch(() => {})
    }, TOKEN_CHECK_INTERVAL)
    return () => clearInterval(interval)
  }, [])

  const logout = useCallback(async () => {
    await authLogout()
    setUser(null)
  }, [])

  return { user, loading, logout, refresh: loadUser }
}
