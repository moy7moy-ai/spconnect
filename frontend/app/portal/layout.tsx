'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { THEME } from '@/config/theme'
import Button from '@/components/ui/Button'

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const router = useRouter()

  async function handleLogout() {
    await logout()
    router.push('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <span className="font-bold text-gray-900" style={{ color: THEME.primaryColor }}>
              {THEME.portalName}
            </span>
            {user?.tenant && (
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-500">
                {user.tenant.nombre}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/portal/perfil"
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              {user?.nombre}
            </a>
            <Button size="sm" variant="ghost" onClick={handleLogout}>
              Cerrar sesión
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        {children}
      </main>
    </div>
  )
}
