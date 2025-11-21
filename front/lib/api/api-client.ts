import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// URLs dos backends
const JAVA_API_URL = process.env.NEXT_PUBLIC_JAVA_API_URL || 'http://localhost:8080';
const NODE_API_URL = process.env.NEXT_PUBLIC_NODE_API_URL || 'http://localhost:8081';

// Função auxiliar para fazer logging de requisições/respostas
const logApiCall = (
  type: 'REQUEST' | 'RESPONSE' | 'ERROR',
  config: InternalAxiosRequestConfig | AxiosResponse | AxiosError,
  service: 'JAVA' | 'NODE'
) => {
  if (typeof window === 'undefined') return; // Não logar no servidor

  const timestamp = new Date().toISOString();
  const logData: any = {
    timestamp,
    service,
    type,
  };

  if (type === 'REQUEST') {
    const reqConfig = config as InternalAxiosRequestConfig;
    logData.method = reqConfig.method?.toUpperCase();
    logData.url = reqConfig.url;
    logData.baseURL = reqConfig.baseURL;
    logData.fullUrl = `${reqConfig.baseURL}${reqConfig.url}`;
    
    // Log headers (ocultar Authorization)
    const headers: any = {};
    Object.keys(reqConfig.headers || {}).forEach((key) => {
      if (key.toLowerCase() === 'authorization') {
        headers[key] = '[REDACTED]';
      } else {
        headers[key] = reqConfig.headers[key];
      }
    });
    logData.headers = headers;
    
    // Log data (limitar tamanho)
    if (reqConfig.data) {
      let dataStr = typeof reqConfig.data === 'string' 
        ? reqConfig.data 
        : JSON.stringify(reqConfig.data);
      if (dataStr.length > 5000) {
        dataStr = dataStr.substring(0, 5000) + '... [truncated]';
      }
      logData.data = dataStr;
    }
  } else if (type === 'RESPONSE') {
    const res = config as AxiosResponse;
    logData.status = res.status;
    logData.statusText = res.statusText;
    logData.url = res.config.url;
    logData.method = res.config.method?.toUpperCase();
    
    // Log headers
    logData.headers = res.headers;
    
    // Log data (limitar tamanho)
    if (res.data) {
      let dataStr = typeof res.data === 'string' 
        ? res.data 
        : JSON.stringify(res.data);
      if (dataStr.length > 5000) {
        dataStr = dataStr.substring(0, 5000) + '... [truncated]';
      }
      logData.data = dataStr;
    }
  } else if (type === 'ERROR') {
    const error = config as AxiosError;
    logData.message = error.message;
    logData.url = error.config?.url;
    logData.method = error.config?.method?.toUpperCase();
    logData.status = error.response?.status;
    logData.statusText = error.response?.statusText;
    
    if (error.response?.data) {
      let dataStr = typeof error.response.data === 'string' 
        ? error.response.data 
        : JSON.stringify(error.response.data);
      if (dataStr.length > 5000) {
        dataStr = dataStr.substring(0, 5000) + '... [truncated]';
      }
      logData.data = dataStr;
    }
  }

  // Log no console (pode ser expandido para enviar ao backend)
  console.log(`[API ${service} ${type}]`, logData);
  
  // Em produção, você pode enviar para um serviço de logging
  // Por exemplo: sendToLoggingService(logData);
};

// Cliente base para backend Java
export const createJavaClient = (getToken?: () => string | null): AxiosInstance => {
  const client = axios.create({
    baseURL: JAVA_API_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Interceptor para adicionar token JWT e logging
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = getToken?.();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      // Log da requisição
      logApiCall('REQUEST', config, 'JAVA');
      return config;
    },
    (error) => {
      logApiCall('ERROR', error, 'JAVA');
      return Promise.reject(error);
    }
  );

  // Interceptor para tratamento de erros e logging
  client.interceptors.response.use(
    (response) => {
      // Log da resposta
      logApiCall('RESPONSE', response, 'JAVA');
      return response;
    },
    (error: AxiosError) => {
      // Log do erro
      logApiCall('ERROR', error, 'JAVA');
      if (error.response?.status === 401) {
        // Token inválido ou expirado
        if (typeof window !== 'undefined') {
          // Usar a origem atual do navegador para garantir que redireciona para a URL correta
          window.location.href = `${window.location.origin}/login`;
        }
      }
      return Promise.reject(error);
    }
  );

  return client;
};

// Cliente base para serviço Node.js
export const createNodeClient = (getToken?: () => string | null): AxiosInstance => {
  const client = axios.create({
    baseURL: NODE_API_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Interceptor para adicionar token JWT e logging
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = getToken?.();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      // Log da requisição
      logApiCall('REQUEST', config, 'NODE');
      return config;
    },
    (error) => {
      logApiCall('ERROR', error, 'NODE');
      return Promise.reject(error);
    }
  );

  // Interceptor para tratamento de erros e logging
  client.interceptors.response.use(
    (response) => {
      // Log da resposta
      logApiCall('RESPONSE', response, 'NODE');
      return response;
    },
    (error: AxiosError) => {
      // Log do erro
      logApiCall('ERROR', error, 'NODE');
      // Para o serviço Node, não redirecionamos em 401 pois pode ser endpoint público
      return Promise.reject(error);
    }
  );

  return client;
};

// Health check functions
export const checkJavaHealth = async (): Promise<boolean> => {
  try {
    const response = await axios.get(`${JAVA_API_URL}/swagger-ui.html`, { timeout: 2000 });
    return response.status === 200 || response.status === 404; // 404 também indica que o servidor está rodando
  } catch (error) {
    return false;
  }
};

export const checkNodeHealth = async (): Promise<boolean> => {
  try {
    // Só executa no cliente (browser)
    if (typeof window === 'undefined') return true;
    
    const response = await axios.get(`${NODE_API_URL}/health`, { 
      timeout: 5000,
      validateStatus: (status) => status < 500, // Aceita 200-499 como sucesso
      headers: {
        'Content-Type': 'application/json',
      },
    });
    console.log('Node health check response:', response.status, response.data);
    return response.status === 200;
  } catch (error: any) {
    console.error('Erro ao verificar saúde do Node:', {
      message: error.message,
      code: error.code,
      response: error.response?.status,
      url: `${NODE_API_URL}/health`,
    });
    return false;
  }
};

