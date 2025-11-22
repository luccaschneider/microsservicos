'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  isOnline, 
  isManualOfflineMode, 
  setManualOfflineMode,
  onOnlineStatusChange 
} from '@/lib/storage/offline-storage';
import { SyncService } from '@/lib/sync/sync-service';
import { useAuth } from '@/hooks/useAuth';
import { 
  getUsuariosNaoSincronizados,
  getInscricoesNaoSincronizadas,
  getPresencasNaoSincronizadas
} from '@/lib/storage/offline-storage';

export function WifiToggle() {
  const auth = useAuth();
  const [online, setOnline] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    setOnline(isOnline());
    
    const unsubscribe = onOnlineStatusChange((isOnlineNow) => {
      setOnline(isOnlineNow);
    });

    return unsubscribe;
  }, []);

  const handleToggle = async () => {
    setIsToggling(true);
    const currentManualMode = isManualOfflineMode();
    const newMode = !currentManualMode;
    
    // Se está desligando o modo offline manual (voltando para online)
    if (currentManualMode && !newMode) {
      // Desativar modo manual primeiro
      setManualOfflineMode(false);
      
      // Aguardar um pouco para garantir que o estado foi atualizado
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Verificar se há dados pendentes para sincronizar
      try {
        const [usuarios, inscricoes, presencas] = await Promise.all([
          getUsuariosNaoSincronizados(),
          getInscricoesNaoSincronizadas(),
          getPresencasNaoSincronizadas(),
        ]);
        const totalPendente = usuarios.length + inscricoes.length + presencas.length;
        
        // Se há dados pendentes e conexão real está online, sincronizar
        if (totalPendente > 0 && navigator.onLine) {
          try {
            console.log(`Iniciando sincronização de ${totalPendente} itens pendentes...`);
            
            // Criar serviço de sincronização
            const syncService = auth.accessToken && auth.user
              ? new SyncService(
                  () => auth.accessToken as string,
                  () => auth.user?.id || null
                )
              : new SyncService(() => null, () => null);
            
            // Sincronizar dados
            const resultado = await syncService.syncOfflineData();
            console.log('Sincronização concluída:', resultado);
            
            // Aguardar um pouco antes de recarregar para garantir que tudo foi processado
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          } catch (error: any) {
            console.error('Erro ao sincronizar após ligar WiFi:', error);
            alert(`Erro ao sincronizar dados: ${error.message || 'Erro desconhecido'}`);
          }
        } else if (totalPendente > 0 && !navigator.onLine) {
          alert('Há dados pendentes para sincronizar, mas você não está conectado à internet.');
        }
      } catch (error) {
        console.error('Erro ao verificar dados pendentes:', error);
      }
    } else {
      // Ativando modo offline manual
      setManualOfflineMode(true);
    }
    
    setIsToggling(false);
  };

  const isManualMode = isManualOfflineMode();
  const isRealOnline = typeof navigator !== 'undefined' && navigator.onLine;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      disabled={isToggling}
      className="flex items-center space-x-2 h-9 px-2 sm:px-3 hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg transition-all"
      title={isManualMode ? 'Ligar WiFi (Voltar Online)' : 'Desligar WiFi (Modo Offline)'}
    >
      {isManualMode ? (
        <WifiOff className="h-4 w-4 text-yellow-600" />
      ) : (
        <Wifi className={`h-4 w-4 ${isRealOnline ? 'text-green-600' : 'text-gray-400'}`} />
      )}
      <span className="hidden sm:inline text-sm">
        {isManualMode ? 'Offline' : 'Online'}
      </span>
    </Button>
  );
}

