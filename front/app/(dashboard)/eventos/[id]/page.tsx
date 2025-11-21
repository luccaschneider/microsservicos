'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useAuth } from '@/hooks/useAuth';
import { useParams, useRouter } from 'next/navigation';
import { JavaClient } from '@/lib/api/java-client';
import type { Evento, Inscricao } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, ArrowLeft, CheckCircle, CheckCircle2, Clock, MapPin, Users, FileText } from 'lucide-react';
import Link from 'next/link';
import { useServiceStatus } from '@/components/ServiceStatus';
import { ServiceError } from '@/components/ServiceError';
import { isOnline } from '@/lib/storage/offline-storage';
import { SyncService } from '@/lib/sync/sync-service';
import { cacheEvento, getCachedEvento, cacheInscricoes, getCachedInscricoes, cachePresenca, getCachedPresenca } from '@/lib/storage/cache-storage';
import type { Presenca } from '@/types';

export default function EventoDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const auth = useAuth(); // Usar useAuth para pegar sessão offline também
  const serviceStatus = useServiceStatus();
  const [evento, setEvento] = useState<Evento | null>(null);
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
  const [presenca, setPresenca] = useState<Presenca | null>(null);
  const [loading, setLoading] = useState(true);
  const [inscrevendo, setInscrevendo] = useState(false);
  const [registrandoPresenca, setRegistrandoPresenca] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [usingCache, setUsingCache] = useState(false);
  const [showInscricaoTerceiro, setShowInscricaoTerceiro] = useState(false);
  const [inscrevendoTerceiro, setInscrevendoTerceiro] = useState(false);
  const [dadosTerceiro, setDadosTerceiro] = useState({ nome: '', email: '', telefone: '' });

  // Usar ref para evitar múltiplas execuções simultâneas
  const loadingRef = useRef(false);

  useEffect(() => {
    const loadData = async () => {
      // Evitar múltiplas execuções simultâneas
      if (loadingRef.current) return;
      loadingRef.current = true;

      // Eventos são públicos, não precisa de usuário para visualizar

      const isOnlineNow = isOnline() && serviceStatus.java;

      // Se estiver offline, tentar carregar do cache primeiro
      if (!isOnlineNow) {
        try {
          const [cachedEvento, cachedInscricoes] = await Promise.all([
            getCachedEvento(id as string),
            getCachedInscricoes(),
          ]);
          
          if (cachedEvento) {
            setEvento(cachedEvento);
          }
          
          // Buscar inscrições offline não sincronizadas também
          let inscricoesCompletas = [...(cachedInscricoes || [])];
          try {
            const { getInscricoesNaoSincronizadas } = await import('@/lib/storage/offline-storage');
            const inscricoesOffline = await getInscricoesNaoSincronizadas();
            for (const inscricaoOffline of inscricoesOffline) {
              // Verificar se a inscrição offline é para este evento
              if (inscricaoOffline.data.eventoId === id) {
                const inscricaoJaExiste = inscricoesCompletas.find((i) => i.id === inscricaoOffline.id);
                if (!inscricaoJaExiste && cachedEvento) {
                  const inscricaoLocal: Inscricao = {
                    id: inscricaoOffline.id,
                    usuarioId: auth.user?.id || '',
                    eventoId: inscricaoOffline.data.eventoId,
                    eventoNome: cachedEvento.nome,
                    dataInscricao: new Date(inscricaoOffline.timestamp).toISOString(),
                    cancelada: false,
                    criadaOffline: true,
                    sincronizado: inscricaoOffline.sincronizado,
                  };
                  inscricoesCompletas.push(inscricaoLocal);
                }
              }
            }
          } catch (err) {
            // Ignorar erros
          }
          
          if (inscricoesCompletas.length > 0) {
            setInscricoes(inscricoesCompletas);
            
            // Buscar presença do cache
            const minhaInscricao = inscricoesCompletas.find(
              (i) => i.eventoId === id && !i.cancelada
            );
            if (minhaInscricao) {
              const cachedPresenca = await getCachedPresenca(minhaInscricao.id);
              if (cachedPresenca) {
                setPresenca(cachedPresenca);
              } else {
                // Tentar buscar presença offline não sincronizada
                try {
                  const { getPresencasNaoSincronizadas } = await import('@/lib/storage/offline-storage');
                  const presencasOffline = await getPresencasNaoSincronizadas();
                  const presencaOffline = presencasOffline.find((p) => p.data.inscricaoId === minhaInscricao.id);
                  if (presencaOffline && cachedEvento) {
                    setPresenca({
                      id: presencaOffline.id,
                      inscricaoId: presencaOffline.data.inscricaoId || '',
                      usuarioId: auth.user?.id || '',
                      eventoId: cachedEvento.id,
                      eventoNome: cachedEvento.nome,
                      dataCheckIn: new Date(presencaOffline.timestamp).toISOString(),
                      criadaOffline: true,
                      sincronizado: presencaOffline.sincronizado,
                    });
                  }
                } catch (offlineErr) {
                  // Ignorar
                }
              }
            }
          }
          
          if (cachedEvento) {
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
        const cachedEvento = await getCachedEvento(id as string);
        if (cachedEvento) {
          setEvento(cachedEvento);
          setUsingCache(true);
          setError(null);
        } else {
          setError('java');
        }
        setLoading(false);
        return;
      }

      // Eventos são públicos, não precisa de token
      try {
        const javaClient = new JavaClient(() => auth.accessToken || null);
        
        // Buscar apenas o evento e a inscrição específica deste evento (não todas as inscrições)
        const eventoData = await javaClient.getEvento(id as string);
        setEvento(eventoData);
        
        // Buscar apenas as inscrições do usuário para este evento específico (se estiver logado)
        let minhaInscricao: Inscricao | undefined;
        if (auth.user && auth.accessToken) {
          try {
            const todasInscricoes = await javaClient.getMinhasInscricoes();
            minhaInscricao = todasInscricoes.find((i) => i.eventoId === id && !i.cancelada);
            // Salvar apenas a inscrição deste evento no estado
            setInscricoes(minhaInscricao ? [minhaInscricao] : []);
            // Salvar todas no cache para uso futuro
            await cacheInscricoes(todasInscricoes);
          } catch (inscErr) {
            // Se falhar, tentar buscar do cache
            const cachedInscricoes = await getCachedInscricoes();
            minhaInscricao = cachedInscricoes?.find((i) => i.eventoId === id && !i.cancelada);
            setInscricoes(minhaInscricao ? [minhaInscricao] : []);
          }
        } else {
          // Se não estiver logado, verificar inscrições offline
          try {
            const { getInscricoesNaoSincronizadas } = await import('@/lib/storage/offline-storage');
            const inscricoesOffline = await getInscricoesNaoSincronizadas();
            const inscricaoOffline = inscricoesOffline.find((i) => i.data.eventoId === id);
            if (inscricaoOffline && eventoData) {
              minhaInscricao = {
                id: inscricaoOffline.id,
                usuarioId: inscricaoOffline.data.usuarioId || '',
                eventoId: inscricaoOffline.data.eventoId,
                eventoNome: eventoData.nome,
                dataInscricao: new Date(inscricaoOffline.timestamp).toISOString(),
                cancelada: false,
                criadaOffline: true,
                sincronizado: inscricaoOffline.sincronizado,
              };
              setInscricoes([minhaInscricao]);
            }
          } catch (offlineErr) {
            // Ignorar
          }
        }
        
        // Salvar evento no cache
        await cacheEvento(eventoData);
        
        // Buscar presença apenas se houver inscrição e usuário logado
        if (minhaInscricao && auth.user && auth.accessToken) {
          try {
            const presencaData = await javaClient.getPresencaPorInscricao(minhaInscricao.id);
            setPresenca(presencaData);
            await cachePresenca(minhaInscricao.id, presencaData);
          } catch (err) {
            // Se não encontrar presença online, verificar cache e offline
            const cachedPresenca = await getCachedPresenca(minhaInscricao.id);
            if (cachedPresenca) {
              setPresenca(cachedPresenca);
            } else {
              try {
                const { getPresencasNaoSincronizadas } = await import('@/lib/storage/offline-storage');
                const presencasOffline = await getPresencasNaoSincronizadas();
                const presencaOffline = presencasOffline.find((p) => p.data.inscricaoId === minhaInscricao!.id);
                if (presencaOffline) {
                  const presencaLocal: Presenca = {
                    id: presencaOffline.id,
                    inscricaoId: presencaOffline.data.inscricaoId || '',
                    usuarioId: auth.user?.id || '',
                    eventoId: eventoData.id,
                    eventoNome: eventoData.nome,
                    dataCheckIn: new Date(presencaOffline.timestamp).toISOString(),
                    criadaOffline: true,
                    sincronizado: presencaOffline.sincronizado,
                  };
                  setPresenca(presencaLocal);
                  await cachePresenca(minhaInscricao.id, presencaLocal);
                } else {
                  setPresenca(null);
                }
              } catch (offlineErr) {
                setPresenca(null);
              }
            }
          }
        } else if (minhaInscricao && auth.user) {
          // Se tiver inscrição mas não tiver token (offline), verificar presença offline
          try {
            const { getPresencasNaoSincronizadas } = await import('@/lib/storage/offline-storage');
            const presencasOffline = await getPresencasNaoSincronizadas();
            const presencaOffline = presencasOffline.find((p) => p.data.inscricaoId === minhaInscricao!.id);
            if (presencaOffline && eventoData) {
              const presencaLocal: Presenca = {
                id: presencaOffline.id,
                inscricaoId: presencaOffline.data.inscricaoId || '',
                usuarioId: auth.user?.id || '',
                eventoId: eventoData.id,
                eventoNome: eventoData.nome,
                dataCheckIn: new Date(presencaOffline.timestamp).toISOString(),
                criadaOffline: true,
                sincronizado: presencaOffline.sincronizado,
              };
              setPresenca(presencaLocal);
            } else {
              setPresenca(null);
            }
          } catch (offlineErr) {
            setPresenca(null);
          }
        } else {
          setPresenca(null);
        }
        
        setUsingCache(false);
        setError(null);
      } catch (err: any) {
        // Se falhar, tentar usar cache
        const cachedEvento = await getCachedEvento(id as string);
        if (cachedEvento) {
          setEvento(cachedEvento);
          setUsingCache(true);
          setError(null);
        } else {
          if (err.code === 'ECONNREFUSED' || err.response?.status === 0) {
            setError('java');
          } else {
            setError('Erro ao carregar evento. Tente novamente.');
          }
        }
        console.error(err);
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    };

    loadData();
    // Usar apenas valores primitivos nas dependências para evitar loops
    // Eventos são públicos, não precisa de auth.user
  }, [id, serviceStatus.java]);

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    window.location.reload();
  };

  const handleInscricao = async () => {
    if (!evento) return;

    // Se não estiver logado, abrir modal de cadastro
    if (!auth.user) {
      setShowInscricaoTerceiro(true);
      return;
    }

    setInscrevendo(true);
    setError(null);

    const online = isOnline() && serviceStatus.java && auth.accessToken;

    try {
      if (online) {
        // Tentar inscrever online primeiro
        try {
          const javaClient = new JavaClient(() => auth.accessToken as string);
          const novaInscricao = await javaClient.createInscricao({
            eventoId: evento.id,
          });
          setInscricoes((prev) => [...prev, novaInscricao]);
          setSuccess('Inscrição realizada com sucesso!');
        } catch (err: any) {
          // Se falhar e for erro de conexão, salvar offline
          if (err.code === 'ECONNREFUSED' || err.response?.status === 0 || err.message?.includes('Network Error')) {
            throw new Error('OFFLINE');
          }
          throw err;
        }
      } else {
        throw new Error('OFFLINE');
      }
    } catch (err: any) {
      if (err.message === 'OFFLINE' || !online) {
        // Salvar offline - funciona mesmo sem token
        try {
          const syncService = new SyncService(
            () => auth.accessToken || null,
            () => auth.user?.id || null
          );
          const offlineId = await syncService.saveInscricaoOffline({
            eventoId: evento.id,
          });
          
          const inscricaoLocal: Inscricao = {
            id: offlineId,
            usuarioId: auth.user?.id || '',
            eventoId: evento.id,
            eventoNome: evento.nome,
            dataInscricao: new Date().toISOString(),
            cancelada: false,
            criadaOffline: true,
            sincronizado: false,
          };
          setInscricoes((prev) => [...prev, inscricaoLocal]);
          setSuccess('Inscrição realizada offline! Será sincronizada quando a conexão for restaurada.');
        } catch (offlineErr) {
          setError('Erro ao salvar inscrição offline. Tente novamente.');
        }
      } else {
        setError(err.response?.data?.message || 'Erro ao se inscrever. Tente novamente.');
      }
    } finally {
      setInscrevendo(false);
    }
  };

  const handleRegistrarPresenca = async () => {
    if (!evento) return;
    
    // Se não estiver logado, não pode registrar presença
    if (!auth.user) {
      setError('Você precisa estar logado para registrar presença.');
      return;
    }

    const minhaInscricao = inscricoes.find(
      (i) => i.eventoId === id && !i.cancelada
    );

    if (!minhaInscricao) {
      setError('Você precisa estar inscrito no evento para fazer check-in.');
      return;
    }

    setRegistrandoPresenca(true);
    setError(null);

    const online = isOnline() && serviceStatus.java && auth.accessToken;

    try {
      if (online) {
        // Tentar registrar online primeiro
        try {
          const javaClient = new JavaClient(() => auth.accessToken as string);
          const presencaData = await javaClient.createPresenca({
            inscricaoId: minhaInscricao.id,
          });
          setPresenca(presencaData);
          setSuccess('Check-in realizado com sucesso!');
        } catch (err: any) {
          // Se falhar e for erro de conexão, salvar offline
          if (err.code === 'ECONNREFUSED' || err.response?.status === 0 || err.message?.includes('Network Error')) {
            throw new Error('OFFLINE');
          }
          throw err;
        }
      } else {
        throw new Error('OFFLINE');
      }
    } catch (err: any) {
      if (err.message === 'OFFLINE' || !online) {
        // Salvar offline - funciona mesmo sem token
        try {
          const syncService = new SyncService(
            () => auth.accessToken || null,
            () => auth.user?.id || null
          );
          const offlineId = await syncService.savePresencaOffline(
            { inscricaoId: minhaInscricao.id },
            minhaInscricao.id
          );
          
          const presencaLocal: Presenca = {
            id: offlineId,
            inscricaoId: minhaInscricao.id,
            usuarioId: auth.user?.id || '',
            eventoId: evento.id,
            eventoNome: evento.nome,
            dataCheckIn: new Date().toISOString(),
            criadaOffline: true,
            sincronizado: false,
          };
          setPresenca(presencaLocal);
          setSuccess('Check-in realizado offline! Será sincronizado quando a conexão for restaurada.');
        } catch (offlineErr) {
          setError('Erro ao salvar check-in offline. Tente novamente.');
        }
      } else {
        setError(
          err.response?.data?.message ||
          'Erro ao registrar presença. Tente novamente.'
        );
      }
    } finally {
      setRegistrandoPresenca(false);
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

  const minhaInscricao = inscricoes.find(
    (i) => i.eventoId === id && !i.cancelada
  );
  const jaInscrito = !!minhaInscricao;
  const temPresenca = !!presenca;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div>Carregando...</div>
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

  if (!evento) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        Evento não encontrado.
      </div>
    );
  }

  const dataInicio = new Date(evento.dataInicio);
  const dataFim = new Date(evento.dataFim);
  const hoje = new Date();
  const isProximo = dataInicio > hoje;
  const isEmAndamento = dataInicio <= hoje && dataFim >= hoje;
  const isFinalizado = dataFim < hoje;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Botão Voltar */}
      <Link href="/eventos">
        <Button variant="ghost" className="mb-6 hover:bg-gray-100">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Eventos
        </Button>
      </Link>

      {/* Header do Evento */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 shadow-xl mb-6">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat'
          }}></div>
        </div>
        
        <div className="relative p-8 md:p-12">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              {isProximo && (
                <span className="inline-block px-3 py-1 text-xs font-semibold text-blue-700 bg-white rounded-full mb-4">
                  Em Breve
                </span>
              )}
              {isEmAndamento && (
                <span className="inline-block px-3 py-1 text-xs font-semibold text-green-700 bg-white rounded-full mb-4">
                  Em Andamento
                </span>
              )}
              {isFinalizado && (
                <span className="inline-block px-3 py-1 text-xs font-semibold text-gray-700 bg-white rounded-full mb-4">
                  Finalizado
                </span>
              )}
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                {evento.nome}
              </h1>
            </div>
            <div className="flex-shrink-0">
              <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <Calendar className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          {evento.descricao && (
            <p className="text-blue-50 text-lg leading-relaxed max-w-3xl">
              {evento.descricao}
            </p>
          )}
        </div>
      </div>

      {/* Informações do Evento */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Data de Início
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {formatDate(evento.dataInicio)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-xl bg-gray-50 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-gray-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Data de Fim
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {formatDate(evento.dataFim)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mensagens de Sucesso/Erro */}
      {usingCache && (
        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 px-6 py-4 rounded-r-lg shadow-sm">
          <p className="font-medium">Exibindo dados em cache (modo offline)</p>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-500 text-green-700 px-6 py-4 rounded-r-lg shadow-sm">
          <div className="flex items-center">
            <CheckCircle className="mr-3 h-5 w-5" />
            <p className="font-medium">{success}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-r-lg shadow-sm">
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Ações do Usuário */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-8">
          {jaInscrito ? (
            <div className="space-y-6">
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-green-900">Você está inscrito neste evento</p>
                  <p className="text-sm text-green-700">Sua participação está confirmada</p>
                </div>
              </div>
              
              {temPresenca ? (
                <div className="p-6 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 rounded-xl bg-blue-500 flex items-center justify-center">
                        <CheckCircle2 className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-blue-900 mb-2 text-lg">Check-in Realizado</h3>
                      {presenca.dataCheckIn && (
                        <div className="flex items-center gap-2 text-blue-700">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm">
                            Realizado em {formatDate(presenca.dataCheckIn)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={handleRegistrarPresenca}
                  disabled={registrandoPresenca}
                  size="lg"
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg h-14 text-base font-semibold"
                >
                  {registrandoPresenca ? (
                    <span className="flex items-center justify-center">
                      <Clock className="mr-2 h-5 w-5 animate-spin" />
                      Registrando Check-in...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      Fazer Check-in
                    </span>
                  )}
                </Button>
              )}
            </div>
          ) : (
            <Button
              onClick={handleInscricao}
              disabled={inscrevendo}
              size="lg"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg h-14 text-base font-semibold"
            >
              {inscrevendo ? (
                <span className="flex items-center justify-center">
                  <Clock className="mr-2 h-5 w-5 animate-spin" />
                  Inscrevendo...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <Users className="mr-2 h-5 w-5" />
                  Inscrever-se no Evento
                </span>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Modal de Inscrição (para usuário não logado ou terceiro) */}
      {showInscricaoTerceiro && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader>
              <CardTitle>{auth.user ? 'Inscrever outra pessoa' : 'Inscrever-se no Evento'}</CardTitle>
              <CardDescription>
                {auth.user 
                  ? 'Preencha os dados básicos da pessoa que será inscrita'
                  : 'Preencha seus dados básicos para se inscrever no evento'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setInscrevendoTerceiro(true);
                  setError(null);

                  try {
                    // Eventos são públicos, não precisa de token para criar usuário
                    const online = isOnline() && serviceStatus.java;

                    // Criar usuário básico (sem senha ainda - será definida depois)
                    // Gerar senha temporária aleatória
                    const senhaTemporaria = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

                    if (online) {
                      try {
                        // Criar cliente público (não precisa de token para criar usuário)
                        const javaClientPublic = new JavaClient();
                        
                        // Tentar criar usuário
                        let novoUsuario: any;
                        try {
                          novoUsuario = await javaClientPublic.createUsuario({
                            nome: dadosTerceiro.nome,
                            email: dadosTerceiro.email,
                            senha: senhaTemporaria,
                            telefone: dadosTerceiro.telefone,
                          });
                        } catch (createErr: any) {
                          // Se der erro de email já cadastrado, informar ao usuário
                          if (createErr.response?.status === 400 || 
                              createErr.message?.includes('já cadastrado') ||
                              createErr.response?.data?.message?.includes('já cadastrado')) {
                            setError('Este email já está cadastrado. Por favor, faça login primeiro.');
                            setInscrevendoTerceiro(false);
                            return;
                          }
                          throw createErr;
                        }

                        // Se não estava logado, fazer login após criar/buscar usuário
                        if (!auth.user) {
                          const loginResponse = await javaClientPublic.login({
                            email: dadosTerceiro.email,
                            senha: senhaTemporaria,
                          });
                          
                          // Fazer login no NextAuth
                          const { signIn } = await import('next-auth/react');
                          await signIn('credentials', {
                            email: dadosTerceiro.email,
                            senha: senhaTemporaria,
                            redirect: false,
                          });
                          
                          // Criar cliente autenticado
                          const javaClient = new JavaClient(() => loginResponse.token);
                          
                          // Inscrever o usuário
                          const novaInscricao = await javaClient.createInscricao({
                            eventoId: evento.id,
                          });
                          
                          setInscricoes((prev) => [...prev, novaInscricao]);
                          setSuccess(`${dadosTerceiro.nome} foi inscrito(a) com sucesso!`);
                          setShowInscricaoTerceiro(false);
                          setDadosTerceiro({ nome: '', email: '', telefone: '' });
                          
                          // Recarregar para atualizar sessão
                          router.refresh();
                          // Usar setTimeout para garantir que o refresh foi processado
                          setTimeout(() => {
                            window.location.reload();
                          }, 100);
                        } else {
                          // Se já estava logado, inscrever como terceiro
                          const javaClient = new JavaClient(() => auth.accessToken as string);
                          const novaInscricao = await javaClient.createInscricaoTerceiro({
                            usuarioId: novoUsuario.id,
                            eventoId: evento.id,
                          });
                          
                          setInscricoes((prev) => [...prev, novaInscricao]);
                          setSuccess(`${dadosTerceiro.nome} foi inscrito(a) com sucesso!`);
                          setShowInscricaoTerceiro(false);
                          setDadosTerceiro({ nome: '', email: '', telefone: '' });
                        }
                      } catch (err: any) {
                        if (err.code === 'ECONNREFUSED' || err.response?.status === 0 || err.message?.includes('Network Error')) {
                          throw new Error('OFFLINE');
                        }
                        // Se for erro de email já cadastrado, mostrar mensagem específica
                        if (err.response?.status === 400 || err.message?.includes('já cadastrado') || err.message?.includes('Email já cadastrado')) {
                          setError('Este email já está cadastrado. Por favor, faça login primeiro.');
                          setInscrevendoTerceiro(false);
                          return;
                        }
                        throw err;
                      }
                    } else {
                      throw new Error('OFFLINE');
                    }
                  } catch (err: any) {
                    if (err.message === 'OFFLINE' || !isOnline()) {
                      // Salvar offline
                      try {
                        const syncService = new SyncService(
                          () => auth.accessToken || null,
                          () => auth.user?.id || null
                        );

                        // Verificar se usuário já existe offline
                        const { getUsuariosOffline } = await import('@/lib/storage/offline-storage');
                        const usuariosOffline = await getUsuariosOffline();
                        const usuarioExistente = usuariosOffline.find(
                          (u) => u.data.email === dadosTerceiro.email
                        );

                        let usuarioId: string;
                        let senhaTemporaria: string;

                        if (usuarioExistente) {
                          // Usuário já existe offline, usar ele
                          usuarioId = usuarioExistente.id;
                          senhaTemporaria = usuarioExistente.data.senha || Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
                        } else {
                          // Criar usuário básico offline
                          senhaTemporaria = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
                          usuarioId = await syncService.saveUsuarioOffline({
                            nome: dadosTerceiro.nome,
                            email: dadosTerceiro.email,
                            senha: senhaTemporaria, // Senha temporária
                            telefone: dadosTerceiro.telefone,
                          });
                        }

                        // Criar inscrição offline para esse usuário (já com usuarioId)
                        const inscricaoId = await syncService.saveInscricaoOffline({
                          eventoId: evento.id,
                          usuarioId: usuarioId, // Incluir usuarioId na inscrição
                        });

                        const inscricaoLocal: Inscricao = {
                          id: inscricaoId,
                          usuarioId: usuarioId,
                          eventoId: evento.id,
                          eventoNome: evento.nome,
                          dataInscricao: new Date().toISOString(),
                          cancelada: false,
                          criadaOffline: true,
                          sincronizado: false,
                        };
                        setInscricoes((prev) => [...prev, inscricaoLocal]);
                        setSuccess(`${dadosTerceiro.nome} foi inscrito(a) offline! Será sincronizado quando a conexão for restaurada.`);
                        setShowInscricaoTerceiro(false);
                        setDadosTerceiro({ nome: '', email: '', telefone: '' });
                        
                        // Se não estava logado, fazer login offline após criar usuário
                        if (!auth.user) {
                          const { loginOffline } = await import('@/lib/auth-offline');
                          await loginOffline(dadosTerceiro.email, senhaTemporaria);
                          // Recarregar a página para atualizar a sessão
                          window.location.reload();
                        }
                      } catch (offlineErr) {
                        setError('Erro ao salvar inscrição offline. Tente novamente.');
                      }
                    } else {
                      setError(err.response?.data?.message || 'Erro ao inscrever pessoa. Tente novamente.');
                    }
                  } finally {
                    setInscrevendoTerceiro(false);
                  }
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="nome-terceiro">Nome *</Label>
                  <Input
                    id="nome-terceiro"
                    value={dadosTerceiro.nome}
                    onChange={(e) => setDadosTerceiro({ ...dadosTerceiro, nome: e.target.value })}
                    placeholder="Nome completo"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-terceiro">Email *</Label>
                  <Input
                    id="email-terceiro"
                    type="email"
                    value={dadosTerceiro.email}
                    onChange={(e) => setDadosTerceiro({ ...dadosTerceiro, email: e.target.value })}
                    placeholder="email@exemplo.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone-terceiro">Telefone (opcional)</Label>
                  <Input
                    id="telefone-terceiro"
                    value={dadosTerceiro.telefone}
                    onChange={(e) => setDadosTerceiro({ ...dadosTerceiro, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowInscricaoTerceiro(false);
                      setDadosTerceiro({ nome: '', email: '', telefone: '' });
                      setError(null);
                    }}
                    className="flex-1"
                    disabled={inscrevendoTerceiro}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={inscrevendoTerceiro}
                    className="flex-1"
                  >
                    {inscrevendoTerceiro ? 'Inscrevendo...' : 'Inscrever'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

