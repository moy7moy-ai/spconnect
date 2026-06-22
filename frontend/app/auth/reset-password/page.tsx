'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'
import { THEME } from '@/config/theme'

function ResetPasswordForm() {
  const router = useRouter()
  const params = useSearchParams()
  const token  = params.get('token') ?? ''
  const email  = params.get('email') ?? ''

  const [password, setPassword]               = useState('')
  const [passwordConfirmation, setConfirm]    = useState('')
  const [error, setError]                     = useState<string | null>(null)
  const [success, setSuccess]                 = useState(false)
  const [loading, setLoading]                 = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await api.post('/reset-password', { token, email, password, password_confirmation: passwordConfirmation })
      setSuccess(true)
      setTimeout(() => router.push('/auth/login'), 2000)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Nueva contraseña</h1>

        {success ? (
          <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
            Contraseña actualizada. Redirigiendo al login…
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Nueva contraseña</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Confirmar contraseña</label>
              <input
                type="password"
                required
                value={passwordConfirmation}
                onChange={e => setConfirm(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
            {error && (
              <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: THEME.primaryColor }}
              className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Guardando…' : 'Guardar contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
