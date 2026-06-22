'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthGuard from '@/components/auth/AuthGuard'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { api, ApiError } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/context/ToastContext'

export default function PortalPerfilPage() {
  const { user, refresh } = useAuth()
  const { addToast } = useToast()
  const router = useRouter()

  const [nombre, setNombre]                   = useState(user?.nombre ?? '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword]               = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [loading, setLoading]                 = useState(false)
  const [fieldErrors, setFieldErrors]         = useState<Record<string, string>>({})
  const [globalError, setGlobalError]         = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFieldErrors({})
    setGlobalError(null)
    setLoading(true)

    const payload: Record<string, string> = { nombre }
    if (password) {
      payload.current_password      = currentPassword
      payload.password              = password
      payload.password_confirmation = passwordConfirmation
    }

    try {
      await api.patch('/profile', payload)
      await refresh()
      addToast('Perfil actualizado correctamente')
      setCurrentPassword('')
      setPassword('')
      setPasswordConfirmation('')
    } catch (err) {
      if (err instanceof ApiError && err.fields) {
        const fe: Record<string, string> = {}
        for (const [k, msgs] of Object.entries(err.fields)) fe[k] = msgs[0]
        setFieldErrors(fe)
      } else {
        setGlobalError((err as Error).message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthGuard>
      <div className="max-w-lg space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mi perfil</h1>
          <p className="mt-1 text-sm text-gray-500">{user?.email}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Nombre completo"
            required
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            error={fieldErrors.nombre}
          />

          <div className="border-t border-gray-100 pt-6 space-y-4">
            <p className="text-sm font-medium text-gray-700">Cambiar contraseña</p>
            <p className="text-xs text-gray-400">Deja estos campos vacíos si no quieres cambiar tu contraseña.</p>

            <Input
              label="Contraseña actual"
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              error={fieldErrors.current_password}
            />
            <Input
              label="Nueva contraseña"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              hint="Mínimo 8 caracteres"
              error={fieldErrors.password}
            />
            <Input
              label="Confirmar nueva contraseña"
              type="password"
              value={passwordConfirmation}
              onChange={e => setPasswordConfirmation(e.target.value)}
            />
          </div>

          {globalError && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{globalError}</p>
          )}

          <div className="flex gap-3">
            <Button type="submit" loading={loading}>
              Guardar cambios
            </Button>
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </AuthGuard>
  )
}
