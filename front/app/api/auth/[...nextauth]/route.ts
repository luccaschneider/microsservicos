import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';
import type { NextRequest } from 'next/server';

// Função para obter a URL base do request (suporta túnel Cloudflare)
function getBaseUrl(request: NextRequest): string {
  // Tentar pegar do header X-Forwarded-Host (usado por proxies/túneis como Cloudflare)
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto');
  
  if (forwardedHost) {
    const protocol = forwardedProto || 'https';
    return `${protocol}://${forwardedHost}`;
  }
  
  // Tentar pegar do header Host
  const host = request.headers.get('host');
  if (host) {
    // Se não tiver protocolo no header, detectar baseado no host
    const protocol = forwardedProto || 
                    (host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https');
    return `${protocol}://${host}`;
  }
  
  // Fallback para variável de ambiente ou localhost (só em desenvolvimento)
  return process.env.NEXTAUTH_URL || 
         process.env.NEXT_PUBLIC_APP_URL || 
         'http://localhost:3000';
}

// Configuração do NextAuth com callbacks customizados
const configuredAuthOptions = {
  ...authOptions,
  callbacks: {
    ...authOptions.callbacks,
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      // Se a URL for relativa, usar a baseUrl
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      
      // Se a URL já for absoluta, verificar se é do mesmo domínio
      try {
        const urlObj = new URL(url);
        if (urlObj.origin === baseUrl) {
          return url;
        }
      } catch {
        // Se não conseguir parsear, tratar como relativa
        return `${baseUrl}${url}`;
      }
      
      // Caso contrário, redirecionar para a baseUrl
      return baseUrl;
    },
  },
};

// Criar handlers uma vez
const { handlers } = NextAuth(configuredAuthOptions);

// Função para corrigir URLs em respostas (substituir localhost:3000 pela URL correta)
function fixResponseUrls(response: Response, correctBaseUrl: string): Response {
  // Se a resposta é um redirect, corrigir a URL
  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get('location');
    if (location && location.includes('localhost:3000') && !correctBaseUrl.includes('localhost:3000')) {
      const fixedLocation = location.replace(/https?:\/\/localhost:3000/g, correctBaseUrl);
      const newHeaders = new Headers(response.headers);
      newHeaders.set('location', fixedLocation);
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    }
  }
  return response;
}

export async function GET(request: NextRequest) {
  // Obter a URL base do request e configurar temporariamente
  const baseUrl = getBaseUrl(request);
  const originalNextAuthUrl = process.env.NEXTAUTH_URL;
  
  // Configurar a URL base para esta requisição
  process.env.NEXTAUTH_URL = baseUrl;
  
  try {
    const response = await handlers.GET(request);
    // Corrigir URLs incorretas na resposta
    return fixResponseUrls(response, baseUrl);
  } finally {
    // Restaurar a URL original
    if (originalNextAuthUrl !== undefined) {
      process.env.NEXTAUTH_URL = originalNextAuthUrl;
    } else {
      delete process.env.NEXTAUTH_URL;
    }
  }
}

export async function POST(request: NextRequest) {
  // Obter a URL base do request e configurar temporariamente
  const baseUrl = getBaseUrl(request);
  const originalNextAuthUrl = process.env.NEXTAUTH_URL;
  
  // Configurar a URL base para esta requisição
  process.env.NEXTAUTH_URL = baseUrl;
  
  try {
    const response = await handlers.POST(request);
    // Corrigir URLs incorretas na resposta
    return fixResponseUrls(response, baseUrl);
  } finally {
    // Restaurar a URL original
    if (originalNextAuthUrl !== undefined) {
      process.env.NEXTAUTH_URL = originalNextAuthUrl;
    } else {
      delete process.env.NEXTAUTH_URL;
    }
  }
}

