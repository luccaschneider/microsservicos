'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { getOfflineSession, type OfflineSession } from '@/lib/auth-offline';
import type { Usuario } from '@/types';

export interface AuthSession {
  user: Usuario | null;
  accessToken: string | null;
  offline: boolean;
}

export function useAuth() {
  const { data: nextAuthSession, status } = useSession();
  
  // Verificar sessão offline de forma síncrona no primeiro render (apenas no cliente)
  const [offlineSession, setOfflineSession] = useState<OfflineSession | null>(() => {
    if (typeof window !== 'undefined') {
      return getOfflineSession();
    }
    return null;
  });

  useEffect(() => {
    // Atualizar sessão offline quando necessário
    if (typeof window !== 'undefined') {
      const session = getOfflineSession();
      // Atualizar se mudou (comparar apenas IDs para evitar loops)
      const currentOfflineId = offlineSession?.user?.id;
      const newOfflineId = session?.user?.id;
      if (newOfflineId !== currentOfflineId) {
        setOfflineSession(session);
      }
    }
    // Usar apenas valores primitivos nas dependências
  }, [nextAuthSession?.user?.id, status, offlineSession?.user?.id]);

  // Se há sessão do NextAuth, usar ela (prioridade)
  if (nextAuthSession && (nextAuthSession as any).user) {
    return {
      user: (nextAuthSession as any).user as Usuario,
      accessToken: (nextAuthSession as any).accessToken as string | null,
      offline: (nextAuthSession as any).offline || false,
    };
  }

  // Se não há sessão do NextAuth mas há sessão offline, usar ela
  if (offlineSession) {
    return {
      user: offlineSession.user,
      accessToken: null,
      offline: true,
    };
  }

  // Sem sessão
  return {
    user: null,
    accessToken: null,
    offline: false,
  };
}

