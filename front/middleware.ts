import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Verificar se há token na sessão (armazenado em cookie) OU sessão offline
  const token = request.cookies.get('next-auth.session-token') || 
                request.cookies.get('__Secure-next-auth.session-token');
  
  // Verificar se há sessão offline no localStorage (só funciona no cliente, mas não bloqueia)
  // O middleware não pode acessar localStorage, então apenas verifica o cookie
  // A verificação de sessão offline será feita no cliente

  // Rotas que requerem autenticação (eventos é público)
  const protectedPaths = ['/inscricoes', '/certificados', '/perfil'];
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );

  // Se for rota protegida e não tiver token, permitir acesso (sessão offline será verificada no cliente)
  // O cliente vai redirecionar se não houver nenhuma sessão
  if (isProtectedPath && !token) {
    // Permitir acesso - a verificação de sessão offline será feita no cliente
    // Se não houver sessão offline, o componente vai redirecionar
    return NextResponse.next();
  }
  
  // Rotas públicas (eventos) sempre permitidas
  if (request.nextUrl.pathname.startsWith('/eventos')) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/eventos/:path*',
    '/inscricoes/:path*',
    '/certificados/:path*',
    '/perfil/:path*',
  ],
};
