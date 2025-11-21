import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/database';

interface LogEntry {
  endpoint: string;
  metodo: string;
  ip?: string;
  userAgent?: string;
  statusCode?: number;
  requestBody?: string;
  responseBody?: string;
  requestHeaders?: string;
  responseHeaders?: string;
  timestamp: Date;
  usuarioId?: string;
}

// Middleware para capturar request/response
export const loggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Pular logging para health check
  if (req.path === '/health') {
    return next();
  }

  const startTime = Date.now();
  const logEntry: LogEntry = {
    endpoint: req.path,
    metodo: req.method,
    ip: getClientIp(req),
    userAgent: req.get('User-Agent'),
    timestamp: new Date(),
  };

  // Capturar request body
  if (req.body && Object.keys(req.body).length > 0) {
    let requestBody = JSON.stringify(req.body);
    // Limitar tamanho (máximo 50KB)
    if (requestBody.length > 50000) {
      requestBody = requestBody.substring(0, 50000) + '... [truncated]';
    }
    logEntry.requestBody = requestBody;
  }

  // Capturar request headers (ocultar Authorization)
  const requestHeaders: any = {};
  Object.keys(req.headers).forEach((key) => {
    if (key.toLowerCase() === 'authorization') {
      requestHeaders[key] = '[REDACTED]';
    } else {
      requestHeaders[key] = req.headers[key];
    }
  });
  logEntry.requestHeaders = JSON.stringify(requestHeaders);

  // Interceptar response
  const originalSend = res.send;
  res.send = function (body: any) {
    // Capturar response body
    if (body) {
      let responseBody = typeof body === 'string' ? body : JSON.stringify(body);
      // Limitar tamanho (máximo 50KB)
      if (responseBody.length > 50000) {
        responseBody = responseBody.substring(0, 50000) + '... [truncated]';
      }
      logEntry.responseBody = responseBody;
    }

    // Capturar response headers
    const responseHeaders: any = {};
    res.getHeaderNames().forEach((name) => {
      responseHeaders[name] = res.getHeader(name);
    });
    logEntry.responseHeaders = JSON.stringify(responseHeaders);

    logEntry.statusCode = res.statusCode;

    // Salvar log (assíncrono, não bloqueia a resposta)
    saveLog(logEntry).catch((err) => {
      console.error('Erro ao salvar log:', err);
    });

    // Log no console também
    const duration = Date.now() - startTime;
    console.log(`[${logEntry.metodo}] ${logEntry.endpoint} - ${logEntry.statusCode} - ${duration}ms`);

    return originalSend.call(this, body);
  };

  next();
};

function getClientIp(req: Request): string {
  const xForwardedFor = req.get('X-Forwarded-For');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  const xRealIp = req.get('X-Real-IP');
  if (xRealIp) {
    return xRealIp;
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

async function saveLog(logEntry: LogEntry): Promise<void> {
  try {
    // Tentar salvar na mesma tabela log_acesso do backend Java
    // Se a tabela não existir ou não tiver os campos, apenas logar no console
    await pool.query(
      `INSERT INTO log_acesso (
        id, endpoint, metodo, ip, user_agent, status_code, 
        request_body, response_body, request_headers, response_headers, timestamp
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
      )`,
      [
        logEntry.endpoint,
        logEntry.metodo,
        logEntry.ip,
        logEntry.userAgent,
        logEntry.statusCode,
        logEntry.requestBody,
        logEntry.responseBody,
        logEntry.requestHeaders,
        logEntry.responseHeaders,
        logEntry.timestamp,
      ]
    );
  } catch (error: any) {
    // Se der erro (tabela não existe ou campos diferentes), apenas logar no console
    console.error('Erro ao salvar log no banco:', error.message);
    // Log detalhado no console como fallback
    console.log('Log Entry:', JSON.stringify(logEntry, null, 2));
  }
}

