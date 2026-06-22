'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { THEME } from '@/config/theme'
import Button from '@/components/ui/Button'

const NAV = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/tenants',   label: 'Tenants' },
  { href: '/admin/usuarios',  label: 'Usuarios' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const router    = useRouter()
  const pathname  = usePathname()

  async function handleLogout() {
    await logout()
    router.push('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-8">
            <span className="font-bold text-gray-900" style={{ color: THEME.primaryColor }}>
              {THEME.companyName}
            </span>
            <nav className="flex gap-1">
              {NAV.map(item => (
                <a
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    pathname.startsWith(item.href)
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/admin/perfil"
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
      <main className="mx-auto max-w-7xl">
        {children}
      </main>
    </div>
  )
}
