import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

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

// Função para criar configuração do NextAuth com URL base específica
function createAuthConfig(baseUrl: string) {
  return {
    ...authOptions,
    callbacks: {
      ...authOptions.callbacks,
      async redirect({ url, baseUrl: callbackBaseUrl }: { url: string; baseUrl: string }) {
        // Usar a baseUrl passada como parâmetro, não a do callback
        const finalBaseUrl = baseUrl || callbackBaseUrl;
        
        // Se a URL for relativa, usar a baseUrl
        if (url.startsWith('/')) {
          return `${finalBaseUrl}${url}`;
        }
        
        // Se a URL já for absoluta, verificar se é do mesmo domínio
        try {
          const urlObj = new URL(url);
          // Se contém localhost:3000 mas não deveria, substituir
          if (urlObj.origin.includes('localhost:3000') && !finalBaseUrl.includes('localhost:3000')) {
            urlObj.host = new URL(finalBaseUrl).host;
            urlObj.protocol = new URL(finalBaseUrl).protocol;
            return urlObj.toString();
          }
          
          if (urlObj.origin === finalBaseUrl) {
            return url;
          }
        } catch {
          // Se não conseguir parsear, tratar como relativa
          return `${finalBaseUrl}${url}`;
        }
        
        // Caso contrário, redirecionar para a baseUrl
        return finalBaseUrl;
      },
    },
  };
}

// Função para corrigir URLs em respostas (substituir localhost:3000 pela URL correta)
async function fixResponseUrls(response: Response, correctBaseUrl: string): Promise<Response> {
  // Clonar a resposta para poder ler o body
  const clonedResponse = response.clone();
  
  // Se a resposta é um redirect, corrigir a URL no header Location
  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get('location');
    if (location) {
      // Substituir qualquer ocorrência de localhost:3000 pela URL correta
      let fixedLocation = location;
      if (location.includes('localhost:3000') && !correctBaseUrl.includes('localhost:3000')) {
        fixedLocation = location.replace(/https?:\/\/localhost:3000/g, correctBaseUrl);
      }
      
      const newHeaders = new Headers(response.headers);
      newHeaders.set('location', fixedLocation);
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    }
  }
  
  // Se a resposta contém HTML ou JSON com URLs, corrigir também
  const contentType = response.headers.get('content-type');
  if (contentType && (contentType.includes('text/html') || contentType.includes('application/json'))) {
    try {
      const text = await clonedResponse.text();
      if (text.includes('localhost:3000') && !correctBaseUrl.includes('localhost:3000')) {
        const fixedText = text.replace(/https?:\/\/localhost:3000/g, correctBaseUrl);
        const newHeaders = new Headers(response.headers);
        return new Response(fixedText, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders,
        });
      }
    } catch {
      // Se não conseguir ler o body, retornar a resposta original
    }
  }
  
  return response;
}

export async function GET(request: NextRequest) {
  // Obter a URL base do request
  const baseUrl = getBaseUrl(request);
  const originalNextAuthUrl = process.env.NEXTAUTH_URL;
  
  // IMPORTANTE: Configurar a URL base ANTES de criar os handlers
  // Isso garante que o NextAuth sempre tenha a URL correta
  process.env.NEXTAUTH_URL = baseUrl;
  
  try {
    // Criar handlers com a URL correta para esta requisição
    const config = createAuthConfig(baseUrl);
    const { handlers } = NextAuth(config);
    
    const response = await handlers.GET(request);
    // Corrigir URLs incorretas na resposta (incluindo erros)
    return await fixResponseUrls(response, baseUrl);
  } catch (error: any) {
    // Se houver erro, redirecionar para a URL correta (não localhost:3000)
    console.error('Erro no NextAuth GET:', error);
    const errorUrl = `${baseUrl}/login?error=Configuration`;
    return NextResponse.redirect(errorUrl);
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
  // Obter a URL base do request
  const baseUrl = getBaseUrl(request);
  const originalNextAuthUrl = process.env.NEXTAUTH_URL;
  
  // IMPORTANTE: Configurar a URL base ANTES de criar os handlers
  // Isso garante que o NextAuth sempre tenha a URL correta
  process.env.NEXTAUTH_URL = baseUrl;
  
  try {
    // Criar handlers com a URL correta para esta requisição
    const config = createAuthConfig(baseUrl);
    const { handlers } = NextAuth(config);
    
    const response = await handlers.POST(request);
    // Corrigir URLs incorretas na resposta (incluindo erros)
    return await fixResponseUrls(response, baseUrl);
  } catch (error: any) {
    // Se houver erro, redirecionar para a URL correta (não localhost:3000)
    console.error('Erro no NextAuth POST:', error);
    const errorUrl = `${baseUrl}/login?error=Configuration`;
    return NextResponse.redirect(errorUrl);
  } finally {
    // Restaurar a URL original
    if (originalNextAuthUrl !== undefined) {
      process.env.NEXTAUTH_URL = originalNextAuthUrl;
    } else {
      delete process.env.NEXTAUTH_URL;
    }
  }
}

