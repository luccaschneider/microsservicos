'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { NodeClient } from '@/lib/api/node-client';
import type { CertificadoValidacao } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ValidarCertificadoPage() {
  const { codigo } = useParams();
  const [validacao, setValidacao] = useState<CertificadoValidacao | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const validar = async () => {
      if (!codigo || typeof codigo !== 'string') {
        setError('Código inválido');
        setLoading(false);
        return;
      }

      try {
        const nodeClient = new NodeClient();
        const resultado = await nodeClient.validarCertificado(codigo);
        setValidacao(resultado);
      } catch (err: any) {
        setError(
          err.response?.data?.error ||
          'Erro ao validar certificado. Verifique o código e tente novamente.'
        );
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    validar();
  }, [codigo]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Validando certificado...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Validação de Certificado</CardTitle>
            <Link href="/certificados">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </Link>
          </div>
          <CardDescription>
            Código: <strong>{codigo}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8">
              <XCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
              <p className="text-lg font-semibold text-gray-900 mb-2">
                Certificado Inválido
              </p>
              <p className="text-gray-600">{error}</p>
            </div>
          ) : validacao?.valido ? (
            <div className="text-center py-8">
              <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
              <p className="text-lg font-semibold text-gray-900 mb-2">
                Certificado Válido
              </p>
              <div className="mt-6 space-y-2 text-left bg-gray-50 p-6 rounded-lg">
                <p>
                  <strong>Participante:</strong> {validacao.usuarioNome}
                </p>
                <p>
                  <strong>Evento:</strong> {validacao.eventoNome}
                </p>
                {validacao.dataEmissao && (
                  <p>
                    <strong>Data de Emissão:</strong>{' '}
                    {formatDate(validacao.dataEmissao)}
                  </p>
                )}
                {validacao.codigoUnico && (
                  <p>
                    <strong>Código Único:</strong> {validacao.codigoUnico}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <XCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
              <p className="text-lg font-semibold text-gray-900 mb-2">
                Certificado Inválido
              </p>
              <p className="text-gray-600">
                O certificado não foi encontrado ou é inválido.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

