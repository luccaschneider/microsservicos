// Sistema de autenticação offline no cliente
import { getUsuariosOffline } from './storage/offline-storage';
import { isOnline } from './storage/offline-storage';
import type { Usuario } from '@/types';

const OFFLINE_SESSION_KEY = 'offline_session';

export interface OfflineSession {
  user: Usuario;
  offline: boolean;
  timestamp: number;
}

export async function loginOffline(email: string, senha: string): Promise<OfflineSession | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const usuariosOffline = await getUsuariosOffline();
    const usuarioEncontrado = usuariosOffline.find(
      (u) => u.data.email === email && u.data.senha === senha
    );

    if (usuarioEncontrado) {
      const usuario: Usuario = {
        id: usuarioEncontrado.data.id,
        nome: usuarioEncontrado.data.nome,
        email: usuarioEncontrado.data.email,
        telefone: usuarioEncontrado.data.telefone,
        dadosCompletos: usuarioEncontrado.data.dadosCompletos || false,
        criadoOffline: true,
        sincronizado: usuarioEncontrado.sincronizado,
        dataCriacao: usuarioEncontrado.data.dataCriacao,
      };

      const session: OfflineSession = {
        user: usuario,
        offline: true,
        timestamp: Date.now(),
      };

      // Salvar sessão offline no localStorage
      localStorage.setItem(OFFLINE_SESSION_KEY, JSON.stringify(session));
      
      return session;
    }

    return null;
  } catch (error) {
    console.error('Erro ao fazer login offline:', error);
    return null;
  }
}

export function getOfflineSession(): OfflineSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const sessionStr = localStorage.getItem(OFFLINE_SESSION_KEY);
    if (sessionStr) {
      const session: OfflineSession = JSON.parse(sessionStr);
      // Verificar se a sessão não expirou (24 horas)
      const maxAge = 24 * 60 * 60 * 1000; // 24 horas em ms
      if (Date.now() - session.timestamp < maxAge) {
        return session;
      } else {
        // Sessão expirada, remover
        localStorage.removeItem(OFFLINE_SESSION_KEY);
      }
    }
  } catch (error) {
    console.error('Erro ao ler sessão offline:', error);
  }

  return null;
}

export function clearOfflineSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(OFFLINE_SESSION_KEY);
  }
}

export function hasOfflineSession(): boolean {
  return getOfflineSession() !== null;
}

