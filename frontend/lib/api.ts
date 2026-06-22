const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api'

// Error con soporte para errores de campo (422 de Laravel)
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fields?: Record<string, string[]>
  ) {
    super(message)
    this.name = 'ApiError'
  }

  // Primer error de un campo específico
  fieldError(key: string): string | undefined {
    return this.fields?.[key]?.[0]
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

function handleUnauthorized() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('auth_token')
  window.location.href = '/auth/login'
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  })

  if (res.status === 401) {
    handleUnauthorized()
    throw new ApiError('Sesión expirada. Redirigiendo al login…', 401)
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: 'Error desconocido' }))
    throw new ApiError(
      body.message ?? `HTTP ${res.status}`,
      res.status,
      res.status === 422 ? body.errors : undefined
    )
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  get:    <T>(path: string)              => request<T>(path, { method: 'GET' }),
  post:   <T>(path: string, body: unknown) => request<T>(path, { method: 'POST',  body: JSON.stringify(body) }),
  put:    <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT',   body: JSON.stringify(body) }),
  patch:  <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string)              => request<T>(path, { method: 'DELETE' }),
}
