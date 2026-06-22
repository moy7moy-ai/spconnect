import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// El middleware no puede leer localStorage (solo existe en el browser).
// La protección de rutas la maneja AuthGuard en el cliente.
// Este middleware solo deja pasar todas las requests.
export function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.svg).*)'],
}
