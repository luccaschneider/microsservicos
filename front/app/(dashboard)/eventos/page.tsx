'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { JavaClient } from '@/lib/api/java-client';
import type { Evento } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Clock, ArrowRight } from 'lucide-react';
import { useServiceStatus } from '@/components/ServiceStatus';
import { ServiceError } from '@/components/ServiceError';
import { isOnline } from '@/lib/storage/offline-storage';
import { cacheEventos, getCachedEventos } from '@/lib/storage/cache-storage';

export default function EventosPage() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingCache, setUsingCache] = useState(false);
  const serviceStatus = useServiceStatus();

  // Usar ref para evitar múltiplas execuções simultâneas
  const loadingRef = useRef(false);

  useEffect(() => {
    const loadEventos = async () => {
      // Evitar múltiplas execuções simultâneas
      if (loadingRef.current) return;
      loadingRef.current = true;

      // Eventos são públicos, não precisa de autenticação

      const online = isOnline() && serviceStatus.java;

      // Se estiver offline, tentar carregar do cache primeiro
      if (!online) {
        try {
          const cachedEventos = await getCachedEventos();
          if (cachedEventos && cachedEventos.length > 0) {
            setEventos(cachedEventos.filter(e => e.ativo !== false));
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
        // Se não tem serviço e não tem cache, mostrar erro
        const cachedEventos = await getCachedEventos();
        if (cachedEventos && cachedEventos.length > 0) {
          setEventos(cachedEventos.filter(e => e.ativo !== false));
          setUsingCache(true);
          setError(null);
        } else {
          setError('java');
        }
        setLoading(false);
        return;
      }

      try {
        // Eventos são públicos, não precisa de token
        const javaClient = new JavaClient();
        const data = await javaClient.listEventos();
        const filteredData = data.filter(e => e.ativo !== false);
        setEventos(filteredData);
        // Salvar no cache
        await cacheEventos(data);
        setUsingCache(false);
        setError(null);
      } catch (err: any) {
        // Se falhar, tentar usar cache
        const cachedEventos = await getCachedEventos();
        if (cachedEventos && cachedEventos.length > 0) {
          setEventos(cachedEventos.filter(e => e.ativo !== false));
          setUsingCache(true);
          setError(null);
        } else {
          // Se for erro de conexão, verificar novamente o status
          if (err.code === 'ECONNREFUSED' || err.response?.status === 0) {
            setError('java');
          } else {
            setError('Erro ao carregar eventos. Tente novamente.');
          }
        }
        console.error(err);
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    };

    loadEventos();
    // Eventos são públicos, não precisa de session
  }, [serviceStatus.java]);

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    // Recarregar a página para verificar novamente
    window.location.reload();
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
        <div>Carregando eventos...</div>
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

  if (error) {
    return (
      <div>
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-r-lg shadow-sm mb-4">
          <p className="font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Eventos Disponíveis</h1>
        <p className="mt-2 text-sm text-gray-600">
          Explore os eventos disponíveis e inscreva-se
        </p>
        {usingCache && (
          <div className="mt-2 bg-yellow-50 border border-yellow-200 text-yellow-700 px-3 py-2 rounded text-sm inline-block">
            Exibindo dados em cache (modo offline)
          </div>
        )}
      </div>

      {eventos.length === 0 ? (
        <Card className="shadow-md">
          <CardContent className="py-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">Nenhum evento disponível no momento.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {eventos.map((evento) => {
            const dataInicio = new Date(evento.dataInicio);
            const dataFim = new Date(evento.dataFim);
            const hoje = new Date();
            const isProximo = dataInicio > hoje;
            const isEmAndamento = dataInicio <= hoje && dataFim >= hoje;
            
            return (
              <Card 
                key={evento.id} 
                className="group relative overflow-hidden border border-gray-200 bg-white hover:border-blue-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col h-full"
              >
                {/* Header com gradiente */}
                <div className="relative h-32 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 p-6 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {isProximo && (
                        <span className="px-2 py-1 text-xs font-semibold text-blue-700 bg-white rounded-full">
                          Em Breve
                        </span>
                      )}
                      {isEmAndamento && (
                        <span className="px-2 py-1 text-xs font-semibold text-green-700 bg-white rounded-full">
                          Em Andamento
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-xl font-bold text-white line-clamp-2 leading-tight">
                      {evento.nome}
                    </CardTitle>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-all">
                      <Calendar className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>

                {/* Conteúdo */}
                <CardContent className="flex-1 flex flex-col p-6 min-h-[280px]">
                  {evento.descricao ? (
                    <CardDescription className="text-gray-600 line-clamp-3 mb-4 min-h-[60px]">
                      {evento.descricao}
                    </CardDescription>
                  ) : (
                    <div className="min-h-[60px] mb-4"></div>
                  )}

                  <div className="mt-auto space-y-3">
                    {/* Datas */}
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 text-sm">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                            <Clock className="h-4 w-4 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 font-medium">Início</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {formatDate(evento.dataInicio)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center">
                            <Clock className="h-4 w-4 text-gray-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 font-medium">Fim</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {formatDate(evento.dataFim)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Botão */}
                    <Link href={`/eventos/${evento.id}`} className="block mt-4">
                      <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md group/btn">
                        <span>Ver Detalhes</span>
                        <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

