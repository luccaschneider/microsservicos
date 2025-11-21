'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { NodeClient } from '@/lib/api/node-client';
import { JavaClient } from '@/lib/api/java-client';
import type { Certificado, Inscricao } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Plus } from 'lucide-react';
import Link from 'next/link';
import { useServiceStatus } from '@/components/ServiceStatus';
import { ServiceError } from '@/components/ServiceError';

export default function CertificadosPage() {
  const { data: session } = useSession();
  const [certificados, setCertificados] = useState<Certificado[]>([]);
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
  const [loading, setLoading] = useState(true);
  const [emitindo, setEmitindo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showEmitir, setShowEmitir] = useState(false);
  const serviceStatus = useServiceStatus();

  useEffect(() => {
    const loadData = async () => {
      if (!session?.accessToken) {
        setLoading(false);
        return;
      }

      if (!serviceStatus.node) {
        setLoading(false);
        setError('node');
        return;
      }

      try {
        const nodeClient = new NodeClient(() => session.accessToken as string);
        const certificadosData = await nodeClient.getMeusCertificados();
        setCertificados(certificadosData);
        setError(null);

        // Tentar carregar inscrições apenas se o Java estiver disponível
        if (serviceStatus.java) {
          try {
            const javaClient = new JavaClient(() => session.accessToken as string);
            const inscricoesData = await javaClient.getMinhasInscricoes();
            // Filtrar apenas inscrições que não têm certificado ainda
            const inscricoesSemCertificado = inscricoesData.filter(
              (insc) =>
                !insc.cancelada &&
                !certificadosData.some((cert) => cert.inscricaoId === insc.id)
            );
            setInscricoes(inscricoesSemCertificado);
          } catch (err) {
            // Se falhar, não é crítico - apenas não mostra opção de emitir
            console.warn('Não foi possível carregar inscrições:', err);
          }
        }
      } catch (err: any) {
        if (err.code === 'ECONNREFUSED' || err.response?.status === 0) {
          setError('node');
        } else if (err.response?.status === 404) {
          setError('node');
        } else {
          setError('Erro ao carregar certificados. Tente novamente.');
        }
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [session, serviceStatus.node, serviceStatus.java]);

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    window.location.reload();
  };

  const handleEmitir = async (inscricaoId: string) => {
    if (!session?.accessToken) return;

    setEmitindo(inscricaoId);
    setError(null);

    try {
      const nodeClient = new NodeClient(() => session.accessToken as string);
      const novoCertificado = await nodeClient.emitirCertificado({ inscricaoId });
      setCertificados((prev) => [novoCertificado, ...prev]);
      setInscricoes((prev) => prev.filter((i) => i.id !== inscricaoId));
      setShowEmitir(false);
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
        'Erro ao emitir certificado. Verifique se você participou do evento.'
      );
    } finally {
      setEmitindo(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div>Carregando certificados...</div>
      </div>
    );
  }

  if (error === 'node') {
    return (
      <div>
        <ServiceError service="node" onRetry={handleRetry} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meus Certificados</h1>
          <p className="mt-2 text-sm text-gray-600">
            Visualize e valide seus certificados de participação
          </p>
        </div>
        {inscricoes.length > 0 && serviceStatus.java && (
          <Button onClick={() => setShowEmitir(!showEmitir)}>
            <Plus className="mr-2 h-4 w-4" />
            Emitir Certificado
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {showEmitir && inscricoes.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Emitir Novo Certificado</CardTitle>
            <CardDescription>
              Selecione um evento para emitir o certificado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {inscricoes.map((inscricao) => (
                <div
                  key={inscricao.id}
                  className="flex justify-between items-center p-3 border rounded"
                >
                  <div>
                    <p className="font-medium">{inscricao.eventoNome}</p>
                    <p className="text-sm text-gray-500">
                      Inscrito em {formatDate(inscricao.dataInscricao)}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleEmitir(inscricao.id)}
                    disabled={emitindo === inscricao.id}
                    size="sm"
                  >
                    {emitindo === inscricao.id ? 'Emitindo...' : 'Emitir'}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {certificados.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">
              Você ainda não possui certificados emitidos.
            </p>
            {!serviceStatus.java && (
              <p className="text-sm text-gray-400">
                Serviço de eventos está offline. Certificados podem ser emitidos quando o serviço estiver disponível.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {certificados.map((certificado) => (
            <Card key={certificado.id}>
              <CardHeader>
                <CardTitle className="text-lg">{certificado.eventoNome}</CardTitle>
                <CardDescription>
                  Emitido em {formatDate(certificado.dataEmissao)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <p className="text-gray-600">
                    <strong>Código:</strong> {certificado.codigoUnico}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/certificados/validar/${certificado.codigoUnico}`}
                    className="flex-1"
                  >
                    <Button variant="outline" className="w-full" size="sm">
                      Validar
                    </Button>
                  </Link>
                  <Link
                    href={certificado.urlValidacao}
                    target="_blank"
                    className="flex-1"
                  >
                    <Button variant="outline" className="w-full" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Ver
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

