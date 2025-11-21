// Cache de dados já carregados para uso offline
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Evento, Inscricao, Presenca } from '@/types';

interface CacheDB extends DBSchema {
  eventos: {
    key: string;
    value: {
      key: string; // 'all' ou id do evento
      data: Evento[] | Evento;
      timestamp: number;
    };
  };
  inscricoes: {
    key: string;
    value: {
      key: string; // 'user' ou id da inscrição
      data: Inscricao[] | Inscricao;
      timestamp: number;
    };
  };
  presencas: {
    key: string;
    value: {
      key: string; // 'inscricaoId' ou id da presença
      data: Presenca | null;
      timestamp: number;
    };
  };
}

let cacheDbInstance: IDBPDatabase<CacheDB> | null = null;

export async function initCacheDB(): Promise<IDBPDatabase<CacheDB>> {
  if (cacheDbInstance) {
    return cacheDbInstance;
  }

  cacheDbInstance = await openDB<CacheDB>('eventos-cache', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('eventos')) {
        db.createObjectStore('eventos', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('inscricoes')) {
        db.createObjectStore('inscricoes', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('presencas')) {
        db.createObjectStore('presencas', { keyPath: 'key' });
      }
    },
  });

  return cacheDbInstance;
}

// Cache de eventos
export async function cacheEventos(eventos: Evento[]): Promise<void> {
  const db = await initCacheDB();
  await db.put('eventos', {
    key: 'all',
    data: eventos,
    timestamp: Date.now(),
  });
}

export async function getCachedEventos(): Promise<Evento[] | null> {
  const db = await initCacheDB();
  const cached = await db.get('eventos', 'all');
  if (!cached) return null;
  
  // Cache válido por 1 hora
  const cacheAge = Date.now() - cached.timestamp;
  if (cacheAge > 60 * 60 * 1000) {
    return null;
  }
  
  return Array.isArray(cached.data) ? cached.data : [cached.data];
}

export async function cacheEvento(evento: Evento): Promise<void> {
  const db = await initCacheDB();
  await db.put('eventos', {
    key: evento.id,
    data: evento,
    timestamp: Date.now(),
  });
}

export async function getCachedEvento(id: string): Promise<Evento | null> {
  const db = await initCacheDB();
  const cached = await db.get('eventos', id);
  if (!cached) return null;
  
  // Cache válido por 1 hora
  const cacheAge = Date.now() - cached.timestamp;
  if (cacheAge > 60 * 60 * 1000) {
    return null;
  }
  
  return Array.isArray(cached.data) ? cached.data[0] : cached.data;
}

// Cache de inscrições
export async function cacheInscricoes(inscricoes: Inscricao[]): Promise<void> {
  const db = await initCacheDB();
  await db.put('inscricoes', {
    key: 'user',
    data: inscricoes,
    timestamp: Date.now(),
  });
}

export async function getCachedInscricoes(): Promise<Inscricao[] | null> {
  const db = await initCacheDB();
  const cached = await db.get('inscricoes', 'user');
  if (!cached) return null;
  
  // Cache válido por 30 minutos
  const cacheAge = Date.now() - cached.timestamp;
  if (cacheAge > 30 * 60 * 1000) {
    return null;
  }
  
  return Array.isArray(cached.data) ? cached.data : [cached.data];
}

export async function cacheInscricao(inscricao: Inscricao): Promise<void> {
  const db = await initCacheDB();
  await db.put('inscricoes', {
    key: inscricao.id,
    data: inscricao,
    timestamp: Date.now(),
  });
}

// Cache de presenças
export async function cachePresenca(inscricaoId: string, presenca: Presenca | null): Promise<void> {
  const db = await initCacheDB();
  await db.put('presencas', {
    key: inscricaoId,
    data: presenca,
    timestamp: Date.now(),
  });
}

export async function getCachedPresenca(inscricaoId: string): Promise<Presenca | null> {
  const db = await initCacheDB();
  const cached = await db.get('presencas', inscricaoId);
  if (!cached) return null;
  
  // Cache válido por 30 minutos
  const cacheAge = Date.now() - cached.timestamp;
  if (cacheAge > 30 * 60 * 1000) {
    return null;
  }
  
  return cached.data;
}

// Limpar cache antigo (opcional, pode ser chamado periodicamente)
export async function clearOldCache(): Promise<void> {
  const db = await initCacheDB();
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 horas

  // Limpar eventos antigos
  const eventos = await db.getAll('eventos');
  for (const evento of eventos) {
    if (now - evento.timestamp > maxAge) {
      await db.delete('eventos', evento.key);
    }
  }

  // Limpar inscrições antigas
  const inscricoes = await db.getAll('inscricoes');
  for (const inscricao of inscricoes) {
    if (now - inscricao.timestamp > maxAge) {
      await db.delete('inscricoes', inscricao.key);
    }
  }

  // Limpar presenças antigas
  const presencas = await db.getAll('presencas');
  for (const presenca of presencas) {
    if (now - presenca.timestamp > maxAge) {
      await db.delete('presencas', presenca.key);
    }
  }
}

