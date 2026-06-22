import AuthGuard from '@/components/auth/AuthGuard'
import RoleGuard from '@/components/auth/RoleGuard'

export const metadata = { title: 'Dashboard — Admin' }

export default function DashboardPage() {
  return (
    <AuthGuard>
      <RoleGuard allowedRoles={['super_admin']}>
        <div className="p-8">
          <h1 className="text-2xl font-bold text-gray-900">Panel de administración</h1>
          <p className="mt-2 text-gray-500">Bienvenido, Super Admin.</p>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <a href="/admin/tenants" className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="font-semibold text-gray-900">Tenants</h2>
              <p className="mt-1 text-sm text-gray-500">Gestionar empresas clientes</p>
            </a>
            <a href="/admin/usuarios" className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="font-semibold text-gray-900">Usuarios</h2>
              <p className="mt-1 text-sm text-gray-500">Gestionar usuarios por tenant</p>
            </a>
          </div>
        </div>
      </RoleGuard>
    </AuthGuard>
  )
}
