import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { JavaClient } from './api/java-client';

export const authOptions: NextAuthConfig = {
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        senha: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.senha) {
          return null;
        }

        // Sempre tentar login online (NextAuth roda no servidor)
        try {
          const javaClient = new JavaClient();
          const authResponse = await javaClient.login({
            email: credentials.email as string,
            senha: credentials.senha as string,
          });

          if (authResponse.token && authResponse.usuario) {
            return {
              id: authResponse.usuario.id,
              email: authResponse.usuario.email,
              name: authResponse.usuario.nome,
              token: authResponse.token,
              usuario: authResponse.usuario,
              offline: false,
            };
          }

          return null;
        } catch (error: any) {
          // Se falhar, retornar null (login offline será tratado no cliente)
          console.error('Erro ao fazer login:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as any).token;
        token.user = (user as any).usuario;
        token.offline = (user as any).offline || false;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        (session as any).accessToken = token.accessToken;
        (session as any).user = token.user || session.user;
        (session as any).offline = token.offline || false;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 horas
  },
  secret: process.env.NEXTAUTH_SECRET || 'your-secret-key-change-in-production',
};

