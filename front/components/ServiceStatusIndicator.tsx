'use client';

import { useEffect, useState } from 'react';
import { checkJavaHealth, checkNodeHealth } from '@/lib/api/api-client';
import type { ServiceStatus } from '@/types';
import { CheckCircle2, AlertTriangle, XCircle, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type StatusType = 'ok' | 'warning' | 'error' | 'loading';

export function ServiceStatusIndicator() {
  const [status, setStatus] = useState<ServiceStatus>({ java: true, node: true });
  const [loading, setLoading] = useState(true);
  const [statusType, setStatusType] = useState<StatusType>('loading');
  const [message, setMessage] = useState<string>('Verificando serviços...');

  useEffect(() => {
    // Só executa no cliente (browser)
    if (typeof window === 'undefined') return;

    const checkStatus = async () => {
      try {
        setLoading(true);
        const [javaStatus, nodeStatus] = await Promise.all([
          checkJavaHealth(),
          checkNodeHealth(),
        ]);
        console.log('ServiceStatusIndicator check:', { java: javaStatus, node: nodeStatus });
        setStatus({ java: javaStatus, node: nodeStatus });

        // Determinar tipo de status
        if (javaStatus && nodeStatus) {
          setStatusType('ok');
          setMessage('Todos os serviços estão operacionais');
        } else if (!javaStatus && !nodeStatus) {
          setStatusType('error');
          setMessage('Sem conexão com os serviços');
        } else {
          setStatusType('warning');
          const issues: string[] = [];
          if (!javaStatus) issues.push('Backend Java (Eventos, Inscrições)');
          if (!nodeStatus) issues.push('Serviço de Certificados');
          setMessage(`Serviços indisponíveis: ${issues.join(', ')}`);
        }
      } catch (error) {
        console.error('Erro no ServiceStatusIndicator:', error);
        setStatusType('error');
        setMessage('Erro ao verificar status dos serviços');
      } finally {
        setLoading(false);
      }
    };

    // Verificar imediatamente
    checkStatus();
    // Verificar novamente após 2 segundos (para dar tempo do serviço iniciar)
    const immediateRetry = setTimeout(checkStatus, 2000);
    // Verificar a cada 30 segundos
    const interval = setInterval(checkStatus, 30000);

    return () => {
      clearInterval(interval);
      clearTimeout(immediateRetry);
    };
  }, []);

  const getStatusIcon = () => {
    if (loading || statusType === 'loading') {
      return <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />;
    }
    
    switch (statusType) {
      case 'ok':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />;
    }
  };

  const getStatusColor = () => {
    if (loading || statusType === 'loading') {
      return 'border-gray-300';
    }
    
    switch (statusType) {
      case 'ok':
        return 'border-green-500';
      case 'warning':
        return 'border-yellow-500';
      case 'error':
        return 'border-red-500';
      default:
        return 'border-gray-300';
    }
  };

  const getTooltipContent = () => {
    if (loading) {
      return 'Verificando status dos serviços...';
    }

    const issues: string[] = [];
    if (!status.java) issues.push('• Backend Java (Eventos, Inscrições)');
    if (!status.node) issues.push('• Serviço de Certificados');

    if (statusType === 'ok') {
      return '✓ Backend Java: Operacional\n✓ Serviço de Certificados: Operacional';
    } else if (statusType === 'error') {
      return '✗ Sem conexão com os serviços\n\nVerifique sua conexão com a internet e tente novamente.';
    } else {
      return `Serviços offline:\n${issues.join('\n')}\n\nAlgumas funcionalidades podem não estar disponíveis.`;
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`
              flex items-center justify-center
              w-10 h-10 rounded-full
              border-2 ${getStatusColor()}
              bg-white shadow-sm
              cursor-pointer
              transition-all hover:scale-110
            `}
          >
            {getStatusIcon()}
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side="bottom" 
          className="max-w-xs bg-white text-gray-900 border border-gray-200 shadow-lg p-4 rounded-lg"
        >
          <div className="whitespace-pre-line text-sm space-y-2">
            <div className="font-semibold text-base mb-2 flex items-center gap-2">
              {statusType === 'ok' && (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-green-600">Status dos Serviços</span>
                </>
              )}
              {statusType === 'warning' && (
                <>
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-yellow-600">Instabilidade Detectada</span>
                </>
              )}
              {statusType === 'error' && (
                <>
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-red-600">Serviços Indisponíveis</span>
                </>
              )}
              {loading && (
                <>
                  <Loader2 className="h-4 w-4 text-gray-500 animate-spin" />
                  <span className="text-gray-700">Verificando...</span>
                </>
              )}
            </div>
            <div className="text-gray-700 leading-relaxed">
              {getTooltipContent()}
            </div>
            {statusType !== 'ok' && !loading && (
              <div className="pt-2 border-t border-gray-200 text-xs text-gray-500">
                Verificação automática a cada 30 segundos
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

