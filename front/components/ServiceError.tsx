'use client';

import { AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ServiceErrorProps {
  service: 'java' | 'node' | 'both';
  onRetry?: () => void;
}

export function ServiceError({ service, onRetry }: ServiceErrorProps) {
  const getServiceName = () => {
    switch (service) {
      case 'java':
        return 'Backend Java';
      case 'node':
        return 'Serviço de Certificados (Node.js)';
      case 'both':
        return 'Serviços Backend';
    }
  };

  const getServiceDescription = () => {
    switch (service) {
      case 'java':
        return 'Este serviço é responsável por gerenciar eventos, inscrições, presenças e usuários.';
      case 'node':
        return 'Este serviço é responsável por emitir e validar certificados de participação.';
      case 'both':
        return 'Os serviços backend são necessários para o funcionamento completo da aplicação.';
    }
  };

  const getAffectedFeatures = () => {
    switch (service) {
      case 'java':
        return [
          'Visualização de eventos',
          'Inscrição em eventos',
          'Gerenciamento de inscrições',
          'Registro de presença',
          'Gerenciamento de perfil',
        ];
      case 'node':
        return [
          'Emissão de certificados',
          'Listagem de certificados',
          'Validação de certificados',
        ];
      case 'both':
        return [
          'Todas as funcionalidades da aplicação',
        ];
    }
  };

  return (
    <Card className="border-red-200 bg-red-50 shadow-md">
      <CardHeader>
        <div className="flex items-center gap-3">
          <XCircle className="h-6 w-6 text-red-600" />
          <div>
            <CardTitle className="text-red-900">Serviço Indisponível</CardTitle>
            <CardDescription className="text-red-700">
              {getServiceName()} não está respondendo
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-red-800 mb-2">
            <strong>Problema identificado:</strong> O serviço {getServiceName()} está offline ou não está acessível.
          </p>
          <p className="text-sm text-red-700 mb-3">
            {getServiceDescription()}
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-red-900 mb-2">
            Funcionalidades afetadas:
          </p>
          <ul className="text-sm text-red-800 list-disc list-inside space-y-1">
            {getAffectedFeatures().map((feature, index) => (
              <li key={index}>{feature}</li>
            ))}
          </ul>
        </div>

        <div className="bg-white border border-red-200 rounded-lg p-3 mt-4">
          <p className="text-sm font-semibold text-gray-900 mb-2">
            Como resolver:
          </p>
          <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
            <li>Verifique se o serviço está rodando na máquina</li>
            <li>Confirme se a porta do serviço está correta</li>
            <li>Verifique sua conexão com a internet</li>
            <li>Entre em contato com o administrador do sistema</li>
          </ul>
        </div>

        {onRetry && (
          <div className="pt-2">
            <Button
              onClick={onRetry}
              variant="outline"
              className="w-full border-red-300 text-red-700 hover:bg-red-100"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar Novamente
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

