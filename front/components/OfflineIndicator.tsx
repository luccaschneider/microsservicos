'use client';

import { useEffect, useState } from 'react';
import { SyncService } from '@/lib/sync/sync-service';
import { getInscricoesNaoSincronizadas, getPresencasNaoSincronizadas, isOnline, onOnlineStatusChange, isManualOfflineMode } from '@/lib/storage/offline-storage';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { useAuth } from '@/hooks/useAuth';

export function OfflineIndicator() {
  const { data: session } = useSession();
  const auth = useAuth(); // Usar useAuth para pegar sessão offline também
  const [online, setOnline] = useState(true);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const updatePendingCount = async () => {
    try {
      const { getUsuariosNaoSincronizados } = await import('@/lib/storage/offline-storage');
      const [usuarios, inscricoes, presencas] = await Promise.all([
        getUsuariosNaoSincronizados(),
        getInscricoesNaoSincronizadas(),
        getPresencasNaoSincronizadas(),
      ]);
      setPendingCount(usuarios.length + inscricoes.length + presencas.length);
    } catch (error) {
      console.error('Erro ao atualizar contador:', error);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    setOnline(isOnline());
    updatePendingCount();
    
    const interval = setInterval(updatePendingCount, 5000);
    const unsubscribe = onOnlineStatusChange(async (isOnlineNow) => {
      setOnline(isOnlineNow);
      if (isOnlineNow && !syncInProgress) {
        // Verificar se há dados pendentes antes de sincronizar
        // Funciona mesmo sem token (sessão offline)
        const { getUsuariosNaoSincronizados } = await import('@/lib/storage/offline-storage');
        const [usuarios, inscricoes, presencas] = await Promise.all([
          getUsuariosNaoSincronizados(),
          getInscricoesNaoSincronizadas(),
          getPresencasNaoSincronizadas(),
        ]);
        const totalPendente = usuarios.length + inscricoes.length + presencas.length;
        
        if (totalPendente > 0) {
          // Pequeno delay para garantir que a conexão está estável
          setTimeout(() => {
            tentarSincronizar();
          }, 500);
        }
      }
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [auth, syncInProgress]);

  const tentarSincronizar = async () => {
    // Verificar se está online antes de sincronizar
    if (!isOnline()) {
      console.log('Não está online, abortando sincronização');
      return;
    }

    if (syncInProgress) {
      return;
    }

    // Verificar se há dados pendentes
    const { getUsuariosNaoSincronizados } = await import('@/lib/storage/offline-storage');
    const [usuarios, inscricoes, presencas] = await Promise.all([
      getUsuariosNaoSincronizados(),
      getInscricoesNaoSincronizadas(),
      getPresencasNaoSincronizadas(),
    ]);
    const totalPendente = usuarios.length + inscricoes.length + presencas.length;

    if (totalPendente === 0) {
      console.log('Nenhum dado pendente para sincronizar');
      await updatePendingCount();
      return;
    }

    setSyncInProgress(true);
    try {
      // Se há usuários pendentes e não há token (sessão offline), sincronizar usuários primeiro
      if (usuarios.length > 0 && !auth.accessToken) {
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
        // Tentar sincronizar sem token
        const syncService = new SyncService(() => null, () => null);
        await syncService.syncOfflineData();
      }
      
      setLastSync(new Date());
      await updatePendingCount();
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
    } finally {
      setSyncInProgress(false);
    }
  };

  if (online && pendingCount === 0) {
    return null;
  }

  return (
    <div
      className={`
        border-l-4 p-4 mb-4 rounded-r-lg shadow-sm
        ${
          !online
            ? 'bg-yellow-50 border-yellow-500'
            : pendingCount > 0
            ? 'bg-blue-50 border-blue-500'
            : 'bg-green-50 border-green-500'
        }
      `}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {!online ? (
            <WifiOff className="h-5 w-5 text-yellow-500" />
          ) : pendingCount > 0 ? (
            <RefreshCw className="h-5 w-5 text-blue-500" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          )}
        </div>
        <div className="ml-3 flex-1">
          {!online ? (
            <>
              <p className="text-sm font-semibold text-yellow-800">
                Modo Offline
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                {isManualOfflineMode() 
                  ? 'Modo offline ativado manualmente. As ações serão salvas localmente e sincronizadas quando você ligar o WiFi novamente.'
                  : 'Você está sem conexão. As ações serão salvas localmente e sincronizadas quando a conexão for restaurada.'}
              </p>
              {pendingCount > 0 && (
                <p className="text-sm text-yellow-600 mt-1">
                  {pendingCount} {pendingCount === 1 ? 'item' : 'itens'} aguardando sincronização
                </p>
              )}
            </>
          ) : pendingCount > 0 ? (
            <>
              <p className="text-sm font-semibold text-blue-800">
                {syncInProgress ? 'Sincronizando Automaticamente...' : 'Dados Pendentes de Sincronização'}
              </p>
              <p className="text-sm text-blue-700 mt-1">
                {pendingCount} {pendingCount === 1 ? 'item' : 'itens'} aguardando sincronização
              </p>
              {syncInProgress && (
                <p className="text-xs text-blue-600 mt-1">
                  Sincronização automática em andamento...
                </p>
              )}
              {lastSync && !syncInProgress && (
                <p className="text-xs text-blue-600 mt-1">
                  Última sincronização: {lastSync.toLocaleTimeString('pt-BR')}
                </p>
              )}
              {!syncInProgress && (
                <Button
                  size="sm"
                  onClick={tentarSincronizar}
                  className="mt-2 bg-blue-600 hover:bg-blue-700"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sincronizar Agora
                </Button>
              )}
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-green-800">
                Tudo Sincronizado
              </p>
              {lastSync && (
                <p className="text-xs text-green-600 mt-1">
                  Última sincronização: {lastSync.toLocaleTimeString('pt-BR')}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
