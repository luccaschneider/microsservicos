'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useAuth } from '@/hooks/useAuth';
import { SyncService } from '@/lib/sync/sync-service';
import { isOnline, onOnlineStatusChange } from '@/lib/storage/offline-storage';
import { getInscricoesNaoSincronizadas, getPresencasNaoSincronizadas } from '@/lib/storage/offline-storage';

export function useOfflineSync() {
  const { data: session } = useSession();
  const auth = useAuth(); // Usar useAuth para pegar sessão offline também
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [online, setOnline] = useState(true);

  const updatePendingCount = useCallback(async () => {
    if (typeof window === 'undefined') return;
    
    const [inscricoes, presencas] = await Promise.all([
      getInscricoesNaoSincronizadas(),
      getPresencasNaoSincronizadas(),
    ]);
    setPendingCount(inscricoes.length + presencas.length);
  }, []);

  const sync = useCallback(async () => {
    // Verificar se está online antes de sincronizar
    if (!isOnline()) {
      console.log('Não está online, abortando sincronização');
      return;
    }

    if (isSyncing) {
      return;
    }

    // Verificar se há dados pendentes
    const [inscricoes, presencas] = await Promise.all([
      getInscricoesNaoSincronizadas(),
      getPresencasNaoSincronizadas(),
    ]);
    const { getUsuariosNaoSincronizados } = await import('@/lib/storage/offline-storage');
    const usuarios = await getUsuariosNaoSincronizados();
    const totalPendente = usuarios.length + inscricoes.length + presencas.length;

    if (totalPendente === 0) {
      console.log('Nenhum dado pendente para sincronizar');
      return;
    }

    setIsSyncing(true);
    try {
      // Se há usuários pendentes e não há token (sessão offline), sincronizar usuários primeiro
      if (usuarios.length > 0 && !auth.accessToken) {
        // Sincronizar apenas usuários primeiro (sem token)
        const syncService = new SyncService(() => null, () => null);
        await syncService.syncOfflineData();
        
        // Após sincronizar usuário, tentar fazer login real
        const usuarioSincronizado = usuarios[0];
        if (usuarioSincronizado?.data?.email && usuarioSincronizado?.data?.senha) {
          try {
            const { signIn } = await import('next-auth/react');
            await signIn('credentials', {
              email: usuarioSincronizado.data.email,
              senha: usuarioSincronizado.data.senha,
              redirect: false,
            });
          } catch (loginError) {
            console.error('Erro ao fazer login após sincronização:', loginError);
          }
        }
      } else if (auth.accessToken) {
        // Sincronizar normalmente com token
        const syncService = new SyncService(
          () => auth.accessToken as string,
          () => auth.user?.id || null
        );
        await syncService.syncOfflineData();
      } else {
        // Tentar sincronizar sem token (pode funcionar para alguns casos)
        const syncService = new SyncService(() => null, () => null);
        await syncService.syncOfflineData();
      }
      
      setLastSync(new Date());
      await updatePendingCount();
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [session, isSyncing, updatePendingCount]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    setOnline(isOnline());
    updatePendingCount();

    const unsubscribe = onOnlineStatusChange(async (isOnlineNow) => {
      setOnline(isOnlineNow);
      if (isOnlineNow) {
        // Verificar se há dados pendentes antes de sincronizar
        const [inscricoes, presencas] = await Promise.all([
          getInscricoesNaoSincronizadas(),
          getPresencasNaoSincronizadas(),
        ]);
        const { getUsuariosNaoSincronizados } = await import('@/lib/storage/offline-storage');
        const usuarios = await getUsuariosNaoSincronizados();
        const totalPendente = usuarios.length + inscricoes.length + presencas.length;
        
        if (totalPendente > 0 && !isSyncing) {
          // Tentar sincronizar automaticamente quando voltar online e houver dados pendentes
          // Funciona mesmo sem token (sessão offline)
          setTimeout(() => {
            sync();
          }, 500); // Pequeno delay para garantir que a conexão está estável
        }
      }
    });

    return unsubscribe;
  }, [auth, isSyncing, sync, updatePendingCount]);

  useEffect(() => {
    // Atualizar contador periodicamente
    const interval = setInterval(updatePendingCount, 5000);
    return () => clearInterval(interval);
  }, [updatePendingCount]);

  return {
    sync,
    isSyncing,
    lastSync,
    pendingCount,
    online,
    updatePendingCount,
  };
}

