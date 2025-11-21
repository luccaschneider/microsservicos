'use client';

import { useEffect, useState } from 'react';
import { checkJavaHealth, checkNodeHealth } from '@/lib/api/api-client';
import type { ServiceStatus } from '@/types';
import { AlertTriangle, XCircle } from 'lucide-react';

export function ServiceStatusComponent() {
  const [status, setStatus] = useState<ServiceStatus>({ java: true, node: true });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      setLoading(true);
      try {
        const [javaStatus, nodeStatus] = await Promise.all([
          checkJavaHealth(),
          checkNodeHealth(),
        ]);
        setStatus({ java: javaStatus, node: nodeStatus });
      } catch (error) {
        setStatus({ java: false, node: false });
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return null;
  }

  const hasIssues = !status.java || !status.node;
  const allOffline = !status.java && !status.node;

  if (!hasIssues) {
    return null;
  }

  return (
    <div
      className={`
        border-l-4 p-4 mb-4 rounded-r-lg shadow-sm
        ${
          allOffline
            ? 'bg-red-50 border-red-500'
            : 'bg-yellow-50 border-yellow-500'
        }
      `}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {allOffline ? (
            <XCircle className="h-5 w-5 text-red-500" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
          )}
        </div>
        <div className="ml-3 flex-1">
          <p
            className={`text-sm font-semibold ${
              allOffline ? 'text-red-800' : 'text-yellow-800'
            }`}
          >
            {allOffline
              ? 'Serviços Indisponíveis'
              : 'Instabilidade nos Serviços'}
          </p>
          <ul className="mt-2 text-sm space-y-1">
            {!status.java && (
              <li
                className={
                  allOffline ? 'text-red-700' : 'text-yellow-700'
                }
              >
                • Backend Java (Eventos, Inscrições) está offline
              </li>
            )}
            {!status.node && (
              <li
                className={
                  allOffline ? 'text-red-700' : 'text-yellow-700'
                }
              >
                • Serviço de Certificados está offline
              </li>
            )}
          </ul>
          <p
            className={`mt-2 text-sm ${
              allOffline ? 'text-red-600' : 'text-yellow-600'
            }`}
          >
            {allOffline
              ? 'Verifique sua conexão com a internet e tente novamente.'
              : 'Algumas funcionalidades podem não estar disponíveis.'}
          </p>
        </div>
      </div>
    </div>
  );
}

export function useServiceStatus() {
  const [status, setStatus] = useState<ServiceStatus>({ java: true, node: true });

  useEffect(() => {
    // Só executa no cliente (browser)
    if (typeof window === 'undefined') return;

    const checkStatus = async () => {
      try {
        const [javaStatus, nodeStatus] = await Promise.all([
          checkJavaHealth(),
          checkNodeHealth(),
        ]);
        console.log('Service status check:', { java: javaStatus, node: nodeStatus });
        setStatus({ java: javaStatus, node: nodeStatus });
      } catch (error) {
        console.error('Erro ao verificar status dos serviços:', error);
        // Não definir tudo como false, apenas verificar individualmente
        try {
          const javaStatus = await checkJavaHealth();
          const nodeStatus = await checkNodeHealth();
          setStatus({ java: javaStatus, node: nodeStatus });
        } catch (e) {
          setStatus({ java: false, node: false });
        }
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

  return status;
}

