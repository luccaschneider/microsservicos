'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ServiceStatusIndicator } from '@/components/ServiceStatusIndicator';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { WifiToggle } from '@/components/WifiToggle';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar, User, FileText, LogOut, ChevronDown, Activity } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { clearOfflineSession } from '@/lib/auth-offline';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Verificar autenticação
    const checkAuth = () => {
      // Se estiver na página de eventos, permitir acesso sem autenticação
      if (pathname.startsWith('/eventos')) {
        setIsChecking(false);
        return;
      }

      // Se há usuário (online ou offline), permitir acesso
      if (auth.user) {
        setIsChecking(false);
        return;
      }

      // Se o NextAuth terminou de carregar e não há sessão offline, redirecionar
      // Mas dar um pequeno delay para garantir que o useAuth tenha tempo de verificar localStorage
      if (status !== 'loading') {
        // Aguardar um pouco mais para dar tempo do useAuth verificar localStorage
        setTimeout(() => {
          if (!auth.user) {
            router.push('/login');
          }
        }, 200);
      }
    };

    checkAuth();
  }, [status, auth.user, router, pathname]);

  if (status === 'loading' || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Carregando...</div>
      </div>
    );
  }

  // Permitir acesso a eventos sem autenticação
  if (!auth.user && !pathname.startsWith('/eventos')) {
    return null; // Redirecionando
  }

  const handleLogout = async () => {
    // Limpar sessão offline se existir
    clearOfflineSession();
    // Limpar sessão do NextAuth
    await signOut({ redirect: false });
    router.push('/login');
  };

  // Usar dados da sessão (online ou offline) - pode ser null se não logado
  const user = auth.user;
  const userName = user?.nome || user?.email || 'Usuário';
  const userEmail = user?.email || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <nav className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo à esquerda */}
            <div className="flex-shrink-0 flex items-center">
              <Link 
                href="/eventos" 
                className="flex items-center space-x-2 group"
              >
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all duration-300 group-hover:scale-105">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div className="hidden sm:block">
                  <div className="text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                    EventHub
                  </div>
                  <div className="text-xs text-gray-500 -mt-1">
                    Sistema de Eventos
                  </div>
                </div>
              </Link>
            </div>

            {/* Links centralizados */}
            <div className="hidden md:flex items-center justify-center flex-1 px-8">
              <nav className="flex items-center space-x-1 bg-gray-50 rounded-xl p-1.5 shadow-inner">
                <Link
                  href="/eventos"
                  className={`relative inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    pathname === '/eventos' || pathname?.startsWith('/eventos/')
                      ? 'bg-white text-blue-600 shadow-sm font-semibold'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-white hover:shadow-sm'
                  }`}
                >
                  <Calendar className={`mr-2 h-4 w-4 ${pathname === '/eventos' || pathname?.startsWith('/eventos/') ? 'text-blue-600' : ''}`} />
                  Eventos
                  {(pathname === '/eventos' || pathname?.startsWith('/eventos/')) && (
                    <span className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-blue-600 rounded-full"></span>
                  )}
                </Link>
                <Link
                  href="/inscricoes"
                  className={`relative inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    pathname === '/inscricoes'
                      ? 'bg-white text-blue-600 shadow-sm font-semibold'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-white hover:shadow-sm'
                  }`}
                >
                  <FileText className={`mr-2 h-4 w-4 ${pathname === '/inscricoes' ? 'text-blue-600' : ''}`} />
                  Inscrições
                  {pathname === '/inscricoes' && (
                    <span className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-blue-600 rounded-full"></span>
                  )}
                </Link>
                <Link
                  href="/certificados"
                  className={`relative inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    pathname === '/certificados' || pathname?.startsWith('/certificados/')
                      ? 'bg-white text-blue-600 shadow-sm font-semibold'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-white hover:shadow-sm'
                  }`}
                >
                  <FileText className={`mr-2 h-4 w-4 ${pathname === '/certificados' || pathname?.startsWith('/certificados/') ? 'text-blue-600' : ''}`} />
                  Certificados
                  {(pathname === '/certificados' || pathname?.startsWith('/certificados/')) && (
                    <span className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-blue-600 rounded-full"></span>
                  )}
                </Link>
                <Link
                  href="/logs"
                  className={`relative inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    pathname === '/logs' || pathname?.startsWith('/logs/')
                      ? 'bg-white text-blue-600 shadow-sm font-semibold'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-white hover:shadow-sm'
                  }`}
                >
                  <Activity className={`mr-2 h-4 w-4 ${pathname === '/logs' || pathname?.startsWith('/logs/') ? 'text-blue-600' : ''}`} />
                  Logs
                  {(pathname === '/logs' || pathname?.startsWith('/logs/')) && (
                    <span className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-blue-600 rounded-full"></span>
                  )}
                </Link>
              </nav>
            </div>

            {/* Menu mobile (links em telas pequenas) */}
            <div className="md:hidden flex items-center space-x-2 flex-1 justify-center">
              <Link
                href="/eventos"
                className={`relative inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === '/eventos' || pathname?.startsWith('/eventos/')
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <Calendar className={`h-4 w-4 ${pathname === '/eventos' || pathname?.startsWith('/eventos/') ? 'text-blue-600' : ''}`} />
                {(pathname === '/eventos' || pathname?.startsWith('/eventos/')) && (
                  <span className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-blue-600 rounded-full"></span>
                )}
              </Link>
              <Link
                href="/inscricoes"
                className={`relative inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === '/inscricoes'
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <FileText className={`h-4 w-4 ${pathname === '/inscricoes' ? 'text-blue-600' : ''}`} />
                {pathname === '/inscricoes' && (
                  <span className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-blue-600 rounded-full"></span>
                )}
              </Link>
              <Link
                href="/certificados"
                className={`relative inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === '/certificados' || pathname?.startsWith('/certificados/')
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <FileText className={`h-4 w-4 ${pathname === '/certificados' || pathname?.startsWith('/certificados/') ? 'text-blue-600' : ''}`} />
                {(pathname === '/certificados' || pathname?.startsWith('/certificados/')) && (
                  <span className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-blue-600 rounded-full"></span>
                )}
              </Link>
            </div>

            {/* Direita: Status e Usuário */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="hidden sm:block">
                <ServiceStatusIndicator />
              </div>
              
              <WifiToggle />
              
              {auth.user ? (
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center space-x-2 h-9 px-2 sm:px-3 hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg transition-all group"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-semibold shadow-md group-hover:shadow-lg transition-all group-hover:scale-105">
                        {userName.charAt(0).toUpperCase()}
                      </div>
                      <div className="hidden lg:block text-left">
                        <p className="text-sm font-medium text-gray-900">
                          {userName}
                        </p>
                        <p className="text-xs text-gray-500 truncate max-w-[140px]">
                          {userEmail}
                        </p>
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-500 hidden sm:block group-hover:text-gray-700 transition-colors" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                          {userName}
                        </p>
                        <p className="text-xs leading-none text-gray-500 truncate">
                          {userEmail}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      href="/perfil"
                      className="flex items-center cursor-pointer w-full"
                    >
                      <User className="mr-2 h-4 w-4" />
                      <span>Meu Perfil</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              ) : (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/cadastro')}
                    className="hidden sm:flex"
                  >
                    Criar Conta
                  </Button>
                  <Button
                    onClick={() => router.push('/login')}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Entrar
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <OfflineIndicator />
      </div>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}

