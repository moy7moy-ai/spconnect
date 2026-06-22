import { api } from './api'

export interface AuthUser {
  id: number
  nombre: string
  email: string
  perfil: string
  permisos: Record<string, string>
  activo: boolean
  tenant_id: number | null
  tenant?: { id: number; nombre: string; activo: boolean; modulos_activos: Record<string, boolean> }
}

export interface LoginResponse {
  token: string
  user: AuthUser
  redirect: string
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const data = await api.post<LoginResponse>('/login', { email, password })
  localStorage.setItem('auth_token', data.token)
  return data
}

export async function logout(): Promise<void> {
  await api.post('/logout', {}).catch(() => {})
  localStorage.removeItem('auth_token')
}

export async function getMe(): Promise<AuthUser> {
  return api.get<AuthUser>('/me')
}

export function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem('auth_token')
}
