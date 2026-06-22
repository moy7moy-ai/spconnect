'use client'

import { useState } from 'react'
import { THEME } from '@/config/theme'
import { api } from '@/lib/api'

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('')
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await api.post('/forgot-password', { email })
      setSent(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Recuperar contraseña</h1>
        <p className="mb-6 text-sm text-gray-500">
          Te enviaremos un enlace para restablecer tu contraseña.
        </p>

        {sent ? (
          <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
            Revisa tu correo. Si existe una cuenta con ese email, recibirás el enlace.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              placeholder="correo@empresa.com"
            />
            {error && (
              <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: THEME.primaryColor }}
              className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Enviar enlace'}
            </button>
            <a href="/auth/login" className="block text-center text-sm text-gray-500 hover:text-black">
              Volver al login
            </a>
          </form>
        )}
      </div>
    </div>
  )
}
