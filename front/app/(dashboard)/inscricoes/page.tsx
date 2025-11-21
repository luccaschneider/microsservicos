'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import { JavaClient } from '@/lib/api/java-client';
import type { Inscricao } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, X, CheckCircle, CheckCircle2, Clock } from 'lucide-react';
import Link from 'next/link';
import { useServiceStatus } from '@/components/ServiceStatus';
import { ServiceError } from '@/components/ServiceError';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { isOnline } from '@/lib/storage/offline-storage';
import { SyncService } from '@/lib/sync/sync-service';
import { cacheInscricoes, getCachedInscricoes, cachePresenca, getCachedPresenca } from '@/lib/storage/cache-storage';
import type { Presenca } from '@/types';

export default function InscricoesPage() {
  const { data: session } = useSession();
  const auth = useAuth(); // Usar useAuth para pegar sessão offline também
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceStatus = useServiceStatus();
  const { sync, isSyncing, pendingCount, online } = useOfflineSync();
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
  const [presencas, setPresencas] = useState<Map<string, Presenca>>(new Map());
  const [loading, setLoading] = useState(true);
  const [cancelando, setCancelando] = useState<string | null>(null);
  const [registrandoPresenca, setRegistrandoPresenca] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [usingCache, setUsingCache] = useState(false);

  useEffect(() => {
    if (searchParams.get('inscricao') === 'sucesso') {
      setSuccess('Inscrição realizada com sucesso!');
      router.replace('/inscricoes');
    }
  }, [searchParams, router]);

  // Usar ref para evitar múltiplas execuções simultâneas
  const loadingRef = useRef(false);

  useEffect(() => {
    const loadInscricoes = async () => {
      // Evitar múltiplas execuções simultâneas
      if (loadingRef.current) return;
      loadingRef.current = true;

      // Verificar se há usuário (online ou offline)
      if (!auth.user) {
        setLoading(false);
        loadingRef.current = false;
        return;
      }

      const isOnlineNow = isOnline() && serviceStatus.java;

      // Se estiver offline, tentar carregar do cache primeiro
      if (!isOnlineNow) {
        try {
          const cachedInscricoes = await getCachedInscricoes();
          if (cachedInscricoes && cachedInscricoes.length > 0) {
            setInscricoes(cachedInscricoes);
            
            // Buscar presenças do cache
            const presencasMap = new Map<string, Presenca>();
            for (const inscricao of cachedInscricoes) {
              const cachedPresenca = await getCachedPresenca(inscricao.id);
              if (cachedPresenca) {
                presencasMap.set(inscricao.id, cachedPresenca);
              }
            }
            
            // Também buscar inscrições offline não sincronizadas
            try {
              const { getInscricoesNaoSincronizadas } = await import('@/lib/storage/offline-storage');
              const inscricoesOffline = await getInscricoesNaoSincronizadas();
              for (const inscricaoOffline of inscricoesOffline) {
                // Verificar se a inscrição offline pertence ao usuário logado
                // Como não temos usuarioId na inscrição offline, vamos assumir que todas pertencem ao usuário logado
                const inscricaoJaExiste = cachedInscricoes.find((i) => i.id === inscricaoOffline.id);
                if (!inscricaoJaExiste) {
                  // Buscar dados do evento do cache ou criar inscrição local
                  const { getCachedEvento } = await import('@/lib/storage/cache-storage');
                  const evento = await getCachedEvento(inscricaoOffline.data.eventoId);
                  if (evento) {
                    const inscricaoLocal: Inscricao = {
                      id: inscricaoOffline.id,
                      usuarioId: auth.user?.id || '',
                      eventoId: inscricaoOffline.data.eventoId,
                      eventoNome: evento.nome,
                      dataInscricao: new Date(inscricaoOffline.timestamp).toISOString(),
                      cancelada: false,
                      criadaOffline: true,
                      sincronizado: inscricaoOffline.sincronizado,
                    };
                    cachedInscricoes.push(inscricaoLocal);
                  }
                }
              }
            } catch (err) {
              // Ignorar erros
            }
            
            // Também buscar presenças offline não sincronizadas
            try {
              const { getPresencasNaoSincronizadas } = await import('@/lib/storage/offline-storage');
              const presencasOffline = await getPresencasNaoSincronizadas();
              for (const presencaOffline of presencasOffline) {
                const inscricao = cachedInscricoes.find((i) => i.id === presencaOffline.data.inscricaoId);
                if (inscricao && !presencasMap.has(inscricao.id)) {
                  presencasMap.set(inscricao.id, {
                    id: presencaOffline.id,
                    inscricaoId: presencaOffline.data.inscricaoId || '',
                    usuarioId: auth.user?.id || '',
                    eventoId: inscricao.eventoId,
                    eventoNome: inscricao.eventoNome || '',
                    dataCheckIn: new Date(presencaOffline.timestamp).toISOString(),
                    criadaOffline: true,
                    sincronizado: presencaOffline.sincronizado,
                  });
                }
              }
            } catch (err) {
              // Ignorar erros
            }
            
            setInscricoes(cachedInscricoes);
            setPresencas(presencasMap);
            setUsingCache(true);
            setError(null);
            setLoading(false);
            return;
          }
        } catch (cacheErr) {
          console.error('Erro ao carregar cache:', cacheErr);
        }
      }

      if (!serviceStatus.java) {
        // Se não tem serviço, tentar usar cache
        const cachedInscricoes = await getCachedInscricoes();
        if (cachedInscricoes && cachedInscricoes.length > 0) {
          setInscricoes(cachedInscricoes);
          setUsingCache(true);
          setError(null);
        } else {
          setError('java');
        }
        setLoading(false);
        return;
      }

      // Só tentar carregar online se houver token
      if (!auth.accessToken) {
        setLoading(false);
        return;
      }

      try {
        const javaClient = new JavaClient(() => auth.accessToken as string);
        const data = await javaClient.getMinhasInscricoes();
        setInscricoes(data);
        // Salvar no cache
        await cacheInscricoes(data);
        
        // Buscar presenças para cada inscrição (online e offline) - em paralelo
        const presencasMap = new Map<string, Presenca>();
        
        // Buscar presenças online em paralelo (mais eficiente)
        const presencaPromises = data.map(async (inscricao) => {
          try {
            const presenca = await javaClient.getPresencaPorInscricao(inscricao.id);
            if (presenca) {
              // Salvar no cache
              await cachePresenca(inscricao.id, presenca);
              return { inscricaoId: inscricao.id, presenca };
            }
          } catch (err) {
            // Se não encontrar presença online, verificar cache
            const cachedPresenca = await getCachedPresenca(inscricao.id);
            if (cachedPresenca) {
              return { inscricaoId: inscricao.id, presenca: cachedPresenca };
            }
          }
          return null;
        });
        
        const presencaResults = await Promise.all(presencaPromises);
        presencaResults.forEach((result) => {
          if (result) {
            presencasMap.set(result.inscricaoId, result.presenca);
          }
        });

        // Buscar presenças offline (se houver)
        try {
          const { getPresencasNaoSincronizadas } = await import('@/lib/storage/offline-storage');
          const presencasOffline = await getPresencasNaoSincronizadas();
          for (const presencaOffline of presencasOffline) {
            const inscricao = data.find((i) => i.id === presencaOffline.data.inscricaoId);
            if (inscricao && !presencasMap.has(inscricao.id)) {
              const presencaLocal: Presenca = {
                id: presencaOffline.id,
                inscricaoId: presencaOffline.data.inscricaoId || '',
                usuarioId: auth.user?.id || '',
                eventoId: inscricao.eventoId,
                eventoNome: inscricao.eventoNome || '',
                dataCheckIn: new Date(presencaOffline.timestamp).toISOString(),
                criadaOffline: true,
                sincronizado: presencaOffline.sincronizado,
              };
              presencasMap.set(inscricao.id, presencaLocal);
              await cachePresenca(inscricao.id, presencaLocal);
            }
          }
        } catch (err) {
          // Ignorar erros ao buscar offline
        }

        setPresencas(presencasMap);
        setUsingCache(false);
        setError(null);
      } catch (err: any) {
        // Se falhar, tentar usar cache
        const cachedInscricoes = await getCachedInscricoes();
        if (cachedInscricoes && cachedInscricoes.length > 0) {
          setInscricoes(cachedInscricoes);
          setUsingCache(true);
          setError(null);
        } else {
          if (err.code === 'ECONNREFUSED' || err.response?.status === 0) {
            setError('java');
          } else {
            setError('Erro ao carregar inscrições. Tente novamente.');
          }
        }
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadInscricoes();
  }, [auth, serviceStatus.java]);

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    window.location.reload();
  };

  const handleCancelar = async (inscricaoId: string) => {
    if (!auth.user || !auth.accessToken) return; // Cancelamento requer sessão online

    if (!confirm('Tem certeza que deseja cancelar esta inscrição?')) {
      return;
    }

    setCancelando(inscricaoId);
    setError(null);

    try {
      const javaClient = new JavaClient(() => auth.accessToken as string);
      await javaClient.cancelarInscricao(inscricaoId);
      setInscricoes((prev) =>
        prev.map((i) =>
          i.id === inscricaoId ? { ...i, cancelada: true } : i
        )
      );
      setSuccess('Inscrição cancelada com sucesso!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao cancelar inscrição. Tente novamente.');
    } finally {
      setCancelando(null);
    }
  };

  const handleRegistrarPresenca = async (inscricaoId: string) => {
    if (!auth.user) return; // Verificar se há usuário (online ou offline)

    setRegistrandoPresenca(inscricaoId);
    setError(null);

    const online = isOnline() && serviceStatus.java && auth.accessToken;
    const inscricao = inscricoes.find((i) => i.id === inscricaoId);

    try {
      if (online) {
        // Tentar registrar online primeiro
        try {
          const javaClient = new JavaClient(() => auth.accessToken as string);
          const presenca = await javaClient.createPresenca({
            inscricaoId,
          });
          setPresencas((prev) => new Map(prev).set(inscricaoId, presenca));
          setSuccess('Presença registrada com sucesso!');
        } catch (err: any) {
          // Se falhar e for erro de conexão, salvar offline
          if (err.code === 'ECONNREFUSED' || err.response?.status === 0) {
            throw new Error('OFFLINE');
          }
          throw err;
        }
      } else {
        throw new Error('OFFLINE');
      }
    } catch (err: any) {
      if (err.message === 'OFFLINE' || !online) {
        // Salvar offline
        try {
          const syncService = new SyncService(
            () => auth.accessToken || null,
            () => auth.user?.id || null
          );
          const offlineId = await syncService.savePresencaOffline(
            { inscricaoId },
            inscricaoId
          );
          
          // Criar presença local temporária
          const presencaLocal: Presenca = {
            id: offlineId,
            inscricaoId,
            usuarioId: auth.user?.id || '',
            eventoId: inscricao?.eventoId || '',
            eventoNome: inscricao?.eventoNome || '',
            dataCheckIn: new Date().toISOString(),
            criadaOffline: true,
            sincronizado: false,
          };
          setPresencas((prev) => new Map(prev).set(inscricaoId, presencaLocal));
          setSuccess('Presença registrada offline! Será sincronizada quando a conexão for restaurada.');
        } catch (offlineErr) {
          setError('Erro ao salvar presença offline. Tente novamente.');
        }
      } else {
        setError(
          err.response?.data?.message ||
          'Erro ao registrar presença. Verifique se você está inscrito no evento.'
        );
      }
    } finally {
      setRegistrandoPresenca(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div>Carregando inscrições...</div>
      </div>
    );
  }

  if (error === 'java') {
    return (
      <div>
        <ServiceError service="java" onRetry={handleRetry} />
      </div>
    );
  }

  const inscricoesAtivas = inscricoes.filter((i) => !i.cancelada);
  const inscricoesCanceladas = inscricoes.filter((i) => i.cancelada);

  return (
    <div>
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Minhas Inscrições</h1>
          <p className="mt-2 text-sm text-gray-600">
            Gerencie suas inscrições em eventos
          </p>
          {usingCache && (
            <div className="mt-2 bg-yellow-50 border border-yellow-200 text-yellow-700 px-3 py-2 rounded text-sm inline-block">
              Exibindo dados em cache (modo offline)
            </div>
          )}
        </div>
        {pendingCount > 0 && online && (
          <Button
            onClick={sync}
            disabled={isSyncing}
            variant="outline"
            className="bg-blue-50 hover:bg-blue-100 border-blue-300"
          >
            {isSyncing ? (
              'Sincronizando...'
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Sincronizar ({pendingCount})
              </>
            )}
          </Button>
        )}
        {!online && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-3 py-2 rounded text-sm">
            Modo Offline
          </div>
        )}
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {inscricoesAtivas.length === 0 && inscricoesCanceladas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 mb-4">Você ainda não possui inscrições.</p>
            <Link href="/eventos">
              <Button>Explorar Eventos</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {inscricoesAtivas.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Inscrições Ativas</h2>
              <div className="space-y-4">
                {inscricoesAtivas.map((inscricao) => {
                  const presenca = presencas.get(inscricao.id);
                  const temPresenca = !!presenca;

                  return (
                    <Card key={inscricao.id} className={temPresenca ? 'border-green-200 bg-green-50/30' : ''}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <CardTitle>{inscricao.eventoNome}</CardTitle>
                              {temPresenca && (
                                <div className="flex items-center gap-1 text-green-600">
                                  <CheckCircle2 className="h-5 w-5" />
                                  <span className="text-sm font-medium">Presente</span>
                                </div>
                              )}
                            </div>
                            <CardDescription>
                              Inscrito em {formatDate(inscricao.dataInscricao)}
                            </CardDescription>
                            {temPresenca && presenca.dataCheckIn && (
                              <CardDescription className="text-green-700 mt-1">
                                <Clock className="inline h-3 w-3 mr-1" />
                                Check-in em {formatDate(presenca.dataCheckIn)}
                              </CardDescription>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {!temPresenca && (
                              <Button
                                size="sm"
                                onClick={() => handleRegistrarPresenca(inscricao.id)}
                                disabled={registrandoPresenca === inscricao.id}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                {registrandoPresenca === inscricao.id ? (
                                  'Registrando...'
                                ) : (
                                  <>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Fazer Check-in
                                  </>
                                )}
                              </Button>
                            )}
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleCancelar(inscricao.id)}
                              disabled={cancelando === inscricao.id}
                            >
                              {cancelando === inscricao.id ? (
                                'Cancelando...'
                              ) : (
                                <>
                                  <X className="mr-2 h-4 w-4" />
                                  Cancelar
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Link href={`/eventos/${inscricao.eventoId}`}>
                          <Button variant="outline">Ver Detalhes do Evento</Button>
                        </Link>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {inscricoesCanceladas.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Inscrições Canceladas</h2>
              <div className="space-y-4">
                {inscricoesCanceladas.map((inscricao) => (
                  <Card key={inscricao.id} className="opacity-60">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{inscricao.eventoNome}</CardTitle>
                          <CardDescription>
                            Cancelada em{' '}
                            {inscricao.dataCancelamento
                              ? formatDate(inscricao.dataCancelamento)
                              : 'Data não disponível'}
                          </CardDescription>
                        </div>
                        <div className="flex items-center text-red-600">
                          <X className="mr-2 h-5 w-5" />
                          Cancelada
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

