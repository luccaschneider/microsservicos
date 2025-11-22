'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { JavaClient } from '@/lib/api/java-client';
import type { LogAcesso, LogAcessoPage } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Filter,
  Download,
  X
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function LogsPage() {
  const auth = useAuth();
  const [logs, setLogs] = useState<LogAcesso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [size] = useState(20);
  
  // Filtros
  const [filtros, setFiltros] = useState({
    endpoint: '',
    metodo: '',
    statusCode: '',
    dataInicio: '',
    dataFim: '',
  });
  const [showFiltros, setShowFiltros] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogAcesso | null>(null);

  useEffect(() => {
    if (auth.accessToken && auth.user) {
      carregarLogs();
    }
  }, [auth.accessToken, auth.user, page]);

  const carregarLogs = async () => {
    if (!auth.accessToken || !auth.user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const client = new JavaClient(() => auth.accessToken);
      // Usar meusLogs para mostrar apenas logs do usuário logado, ordenados por data decrescente
      const params: any = {
        page,
        size,
        sort: 'timestamp,desc', // Ordenar por timestamp decrescente (mais recentes primeiro)
      };

      const response = await client.meusLogs(params);
      setLogs(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (err: any) {
      console.error('Erro ao carregar logs:', err);
      setError(err.response?.data?.message || 'Erro ao carregar logs');
    } finally {
      setLoading(false);
    }
  };

  const limparFiltros = () => {
    setFiltros({
      endpoint: '',
      metodo: '',
      statusCode: '',
      dataInicio: '',
      dataFim: '',
    });
    setPage(0);
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleString('pt-BR');
  };

  const getStatusColor = (statusCode?: number) => {
    if (!statusCode) return 'text-gray-500';
    if (statusCode >= 200 && statusCode < 300) return 'text-green-600';
    if (statusCode >= 300 && statusCode < 400) return 'text-blue-600';
    if (statusCode >= 400 && statusCode < 500) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMetodoColor = (metodo: string) => {
    switch (metodo.toUpperCase()) {
      case 'GET': return 'bg-blue-100 text-blue-800';
      case 'POST': return 'bg-green-100 text-green-800';
      case 'PUT': return 'bg-yellow-100 text-yellow-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Carregando logs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Logs de Acesso</h1>
          <p className="text-gray-600 mt-1">
            Visualize todas as requisições e respostas das APIs
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFiltros(!showFiltros)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
          <Button
            variant="outline"
            onClick={carregarLogs}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </div>

      {showFiltros && (
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="endpoint">Endpoint</Label>
              <Input
                id="endpoint"
                placeholder="/eventos"
                value={filtros.endpoint}
                onChange={(e) => setFiltros({ ...filtros, endpoint: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="metodo">Método</Label>
              <Input
                id="metodo"
                placeholder="GET, POST, PUT, DELETE"
                value={filtros.metodo}
                onChange={(e) => setFiltros({ ...filtros, metodo: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="statusCode">Status Code</Label>
              <Input
                id="statusCode"
                type="number"
                placeholder="200, 404, 500..."
                value={filtros.statusCode}
                onChange={(e) => setFiltros({ ...filtros, statusCode: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="dataInicio">Data Início</Label>
              <Input
                id="dataInicio"
                type="datetime-local"
                value={filtros.dataInicio}
                onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="dataFim">Data Fim</Label>
              <Input
                id="dataFim"
                type="datetime-local"
                value={filtros.dataFim}
                onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
              />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={limparFiltros} className="w-full">
                <X className="h-4 w-4 mr-2" />
                Limpar
              </Button>
            </div>
          </div>
        </Card>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Método
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Endpoint
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Nenhum log encontrado
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {formatarData(log.timestamp)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${getMetodoColor(log.metodo)}`}>
                        {log.metodo}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {log.endpoint}
                      </code>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-sm font-semibold ${getStatusColor(log.statusCode)}`}>
                        {log.statusCode || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {log.usuarioNome || log.usuarioEmail || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {log.ip || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        Detalhes
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-4 py-3 border-t flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Mostrando {page * size + 1} a {Math.min((page + 1) * size, totalElements)} de {totalElements} logs
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages - 1}
              >
                Próxima
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Detalhes do Log</h2>
                <Button variant="ghost" onClick={() => setSelectedLog(null)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>ID</Label>
                    <p className="text-sm text-gray-700">{selectedLog.id}</p>
                  </div>
                  <div>
                    <Label>Timestamp</Label>
                    <p className="text-sm text-gray-700">{formatarData(selectedLog.timestamp)}</p>
                  </div>
                  <div>
                    <Label>Método</Label>
                    <p className="text-sm text-gray-700">{selectedLog.metodo}</p>
                  </div>
                  <div>
                    <Label>Endpoint</Label>
                    <p className="text-sm text-gray-700">{selectedLog.endpoint}</p>
                  </div>
                  <div>
                    <Label>Status Code</Label>
                    <p className={`text-sm font-semibold ${getStatusColor(selectedLog.statusCode)}`}>
                      {selectedLog.statusCode || '-'}
                    </p>
                  </div>
                  <div>
                    <Label>IP</Label>
                    <p className="text-sm text-gray-700">{selectedLog.ip || '-'}</p>
                  </div>
                  <div>
                    <Label>User Agent</Label>
                    <p className="text-sm text-gray-700 break-all">{selectedLog.userAgent || '-'}</p>
                  </div>
                  {selectedLog.usuarioNome && (
                    <div>
                      <Label>Usuário</Label>
                      <p className="text-sm text-gray-700">
                        {selectedLog.usuarioNome} ({selectedLog.usuarioEmail})
                      </p>
                    </div>
                  )}
                </div>

                {selectedLog.requestHeaders && (
                  <div>
                    <Label>Request Headers</Label>
                    <pre className="mt-1 p-3 bg-gray-50 rounded text-xs overflow-x-auto">
                      {selectedLog.requestHeaders}
                    </pre>
                  </div>
                )}

                {selectedLog.requestBody && (
                  <div>
                    <Label>Request Body</Label>
                    <pre className="mt-1 p-3 bg-gray-50 rounded text-xs overflow-x-auto">
                      {selectedLog.requestBody}
                    </pre>
                  </div>
                )}

                {selectedLog.responseHeaders && (
                  <div>
                    <Label>Response Headers</Label>
                    <pre className="mt-1 p-3 bg-gray-50 rounded text-xs overflow-x-auto">
                      {selectedLog.responseHeaders}
                    </pre>
                  </div>
                )}

                {selectedLog.responseBody && (
                  <div>
                    <Label>Response Body</Label>
                    <pre className="mt-1 p-3 bg-gray-50 rounded text-xs overflow-x-auto">
                      {selectedLog.responseBody}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

