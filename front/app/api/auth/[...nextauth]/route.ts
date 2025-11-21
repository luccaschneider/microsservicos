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

// Configuração do NextAuth com callback de redirect customizado
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

export async function GET(request: NextRequest) {
  // Obter a URL base do request e configurar temporariamente
  const baseUrl = getBaseUrl(request);
  const originalNextAuthUrl = process.env.NEXTAUTH_URL;
  
  // Configurar a URL base para esta requisição
  process.env.NEXTAUTH_URL = baseUrl;
  
  try {
    return handlers.GET(request);
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
    return handlers.POST(request);
  } finally {
    // Restaurar a URL original
    if (originalNextAuthUrl !== undefined) {
      process.env.NEXTAUTH_URL = originalNextAuthUrl;
    } else {
      delete process.env.NEXTAUTH_URL;
    }
  }
}

