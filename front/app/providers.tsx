'use client';

import { SessionProvider } from 'next-auth/react';

export function Providers({ children }: { children: React.ReactNode }) {
  // O SessionProvider detecta automaticamente a URL base do navegador
  // Não precisamos passar baseUrl explicitamente, pois o NextAuth v5
  // usa trustHost: true e detecta através dos headers
  return (
    <SessionProvider
      basePath="/api/auth"
      refetchInterval={60} // Verificar sessão a cada 60 segundos
      refetchOnWindowFocus={true}
    >
      {children}
    </SessionProvider>
  );
}

