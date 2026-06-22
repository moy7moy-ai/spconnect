'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { MODULES } from '@/config/modules'
import { THEME } from '@/config/theme'

const NAV = MODULES.map(m => ({ ...m, href: `/portal/${m.key}` }))

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const { can, isSuperAdmin } = usePermissions()
  const pathname  = usePathname()
  const router    = useRouter()
  const [open, setOpen] = useState(false)

  const visibleNav = NAV.filter(item =>
    isSuperAdmin || (
      user?.tenant?.modulos_activos?.[item.key] === true && can(item.key)
    )
  )

  async function handleLogout() {
    await logout()
    router.push('/auth/login')
  }

  const Sidebar = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-100">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white text-sm font-bold"
          style={{ backgroundColor: THEME.primaryColor }}
        >
          SP
        </div>
        <span className="font-bold text-gray-900 text-sm leading-tight">
          {THEME.portalName}
        </span>
      </div>

      {/* Tenant badge */}
      {user?.tenant && (
        <div className="px-5 py-3 border-b border-gray-100">
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Empresa</p>
          <p className="mt-0.5 text-sm font-medium text-gray-700 truncate">{user.tenant.nombre}</p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {visibleNav.map(item => {
          const active = pathname.startsWith(item.href)
          return (
            <a
              key={item.key}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
              style={active ? { backgroundColor: THEME.primaryColor } : {}}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </a>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-gray-100 px-3 py-3 space-y-0.5">
        <a
          href="/portal/perfil"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-600">
            {user?.nombre?.[0]?.toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-800">{user?.nombre}</p>
            <p className="truncate text-xs text-gray-400">{user?.email}</p>
          </div>
        </a>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <span className="text-base">🚪</span>
          Cerrar sesión
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">

      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-gray-200 bg-white">
        <Sidebar />
      </aside>

      {/* Sidebar mobile — overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-200 lg:hidden ${
        open ? 'flex translate-x-0' : 'flex -translate-x-full'
      }`}>
        <Sidebar />
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Mobile top bar */}
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-bold text-sm" style={{ color: THEME.primaryColor }}>
            {THEME.portalName}
          </span>
          <div className="w-9" />
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
