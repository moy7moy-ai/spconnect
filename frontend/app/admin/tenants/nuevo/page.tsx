import AuthGuard from '@/components/auth/AuthGuard'
import RoleGuard from '@/components/auth/RoleGuard'
import TenantForm from '@/components/admin/TenantForm'

export const metadata = { title: 'Nuevo tenant' }

export default function NuevoTenantPage() {
  return (
    <AuthGuard>
      <RoleGuard allowedRoles={['super_admin']}>
        <div className="p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nuevo tenant</h1>
            <p className="mt-1 text-sm text-gray-500">Registra una nueva empresa en el sistema</p>
          </div>
          <TenantForm />
        </div>
      </RoleGuard>
    </AuthGuard>
  )
}
