// Armazenamento offline usando IndexedDB
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Inscricao, Presenca, Usuario, InscricaoCreateDTO, PresencaCreateDTO } from '@/types';

interface OfflineDB extends DBSchema {
  inscricoes: {
    key: string;
    value: {
      id: string;
      data: InscricaoCreateDTO;
      timestamp: number;
      sincronizado: boolean;
    };
  };
  presencas: {
    key: string;
    value: {
      id: string;
      data: PresencaCreateDTO;
      timestamp: number;
      sincronizado: boolean;
    };
  };
  usuarios: {
    key: string;
    value: {
      id: string;
      data: Usuario & { senha?: string }; // Senha temporária para sincronização
      timestamp: number;
      sincronizado: boolean;
    };
  };
}

let dbInstance: IDBPDatabase<OfflineDB> | null = null;

export async function initOfflineDB(): Promise<IDBPDatabase<OfflineDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    dbInstance = await openDB<OfflineDB>('eventos-offline', 1, {
      upgrade(db) {
        // Criar stores se não existirem
        if (!db.objectStoreNames.contains('inscricoes')) {
          db.createObjectStore('inscricoes', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('presencas')) {
          db.createObjectStore('presencas', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('usuarios')) {
          db.createObjectStore('usuarios', { keyPath: 'id' });
        }
      },
    });

    console.log('IndexedDB inicializado com sucesso');
    return dbInstance;
  } catch (error) {
    console.error('Erro ao inicializar IndexedDB:', error);
    throw error;
  }
}

// Inscrições offline
export async function saveInscricaoOffline(
  inscricaoData: InscricaoCreateDTO & { usuarioId?: string }
): Promise<string> {
  try {
    const db = await initOfflineDB();
    const id = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const item = {
      id,
      data: inscricaoData,
      timestamp: Date.now(),
      sincronizado: false,
    };
    
    await db.put('inscricoes', item);
    console.log('Inscrição salva offline:', id, inscricaoData);
    
    return id;
  } catch (error) {
    console.error('Erro ao salvar inscrição offline:', error);
    throw error;
  }
}

export async function getInscricoesOffline(): Promise<Array<{
  id: string;
  data: InscricaoCreateDTO;
  timestamp: number;
  sincronizado: boolean;
}>> {
  const db = await initOfflineDB();
  return db.getAll('inscricoes');
}

export async function getInscricoesNaoSincronizadas(): Promise<Array<{
  id: string;
  data: InscricaoCreateDTO;
  timestamp: number;
  sincronizado: boolean;
}>> {
  const db = await initOfflineDB();
  const all = await db.getAll('inscricoes');
  return all.filter((item) => !item.sincronizado);
}

export async function markInscricaoSincronizada(id: string): Promise<void> {
  const db = await initOfflineDB();
  const item = await db.get('inscricoes', id);
  if (item) {
    item.sincronizado = true;
    await db.put('inscricoes', item);
  }
}

export async function removeInscricaoOffline(id: string): Promise<void> {
  const db = await initOfflineDB();
  await db.delete('inscricoes', id);
}

// Presenças offline
export async function savePresencaOffline(
  presencaData: PresencaCreateDTO,
  inscricaoId: string
): Promise<string> {
  try {
    const db = await initOfflineDB();
    const id = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const dataToSave: PresencaCreateDTO & { inscricaoId: string } = {
      ...presencaData,
      inscricaoId: presencaData.inscricaoId || inscricaoId,
    } as PresencaCreateDTO & { inscricaoId: string };
    
    const item = {
      id,
      data: dataToSave,
      timestamp: Date.now(),
      sincronizado: false,
    };
    
    await db.put('presencas', item);
    console.log('Presença salva offline:', id, dataToSave);
    
    return id;
  } catch (error) {
    console.error('Erro ao salvar presença offline:', error);
    throw error;
  }
}

export async function getPresencasOffline(): Promise<Array<{
  id: string;
  data: PresencaCreateDTO & { inscricaoId: string };
  timestamp: number;
  sincronizado: boolean;
}>> {
  const db = await initOfflineDB();
  const all = await db.getAll('presencas');
  return all.map((item) => ({
    ...item,
    data: item.data as PresencaCreateDTO & { inscricaoId: string },
  }));
}

export async function getPresencasNaoSincronizadas(): Promise<Array<{
  id: string;
  data: PresencaCreateDTO & { inscricaoId: string };
  timestamp: number;
  sincronizado: boolean;
}>> {
  const db = await initOfflineDB();
  const all = await db.getAll('presencas');
  return all
    .filter((item) => !item.sincronizado)
    .map((item) => ({
      ...item,
      data: item.data as PresencaCreateDTO & { inscricaoId: string },
    }));
}

export async function markPresencaSincronizada(id: string): Promise<void> {
  const db = await initOfflineDB();
  const item = await db.get('presencas', id);
  if (item) {
    item.sincronizado = true;
    await db.put('presencas', item);
  }
}

export async function removePresencaOffline(id: string): Promise<void> {
  const db = await initOfflineDB();
  await db.delete('presencas', id);
}

// Usuários offline
export async function saveUsuarioOffline(
  usuarioData: { nome: string; email: string; senha: string; telefone?: string }
): Promise<string> {
  try {
    const db = await initOfflineDB();
    const id = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const usuarioToSave: Usuario & { senha: string } = {
      id,
      nome: usuarioData.nome,
      email: usuarioData.email,
      senha: usuarioData.senha, // Senha em texto plano (será hashada pelo backend na sincronização)
      telefone: usuarioData.telefone,
    dadosCompletos: false,
    criadoOffline: true,
    sincronizado: false,
    dataCriacao: new Date().toISOString(),
  };
  
    const item = {
      id,
      data: usuarioToSave,
      timestamp: Date.now(),
      sincronizado: false,
    };
    
    await db.put('usuarios', item);
    console.log('Usuário salvo offline:', id, usuarioData.email);
    
    return id;
  } catch (error) {
    console.error('Erro ao salvar usuário offline:', error);
    throw error;
  }
}

export async function getUsuariosOffline(): Promise<Array<{
  id: string;
  data: Usuario & { senha?: string };
  timestamp: number;
  sincronizado: boolean;
}>> {
  const db = await initOfflineDB();
  return db.getAll('usuarios');
}

export async function getUsuariosNaoSincronizados(): Promise<Array<{
  id: string;
  data: Usuario & { senha?: string };
  timestamp: number;
  sincronizado: boolean;
}>> {
  const db = await initOfflineDB();
  const all = await db.getAll('usuarios');
  return all.filter((item) => !item.sincronizado);
}

export async function markUsuarioSincronizado(id: string): Promise<void> {
  const db = await initOfflineDB();
  const item = await db.get('usuarios', id);
  if (item) {
    item.sincronizado = true;
    await db.put('usuarios', item);
  }
}

export async function removeUsuarioOffline(id: string): Promise<void> {
  const db = await initOfflineDB();
  await db.delete('usuarios', id);
}

export async function buscarUsuarioOfflinePorEmail(email: string): Promise<Usuario | null> {
  const db = await initOfflineDB();
  const all = await db.getAll('usuarios');
  const usuario = all.find((item) => item.data.email === email);
  return usuario ? usuario.data : null;
}

// Constantes para controle manual de offline
const OFFLINE_MANUAL_KEY = 'eventos_offline_manual';

// Funções para controlar modo offline manual
export function setManualOfflineMode(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  if (enabled) {
    localStorage.setItem(OFFLINE_MANUAL_KEY, 'true');
  } else {
    localStorage.removeItem(OFFLINE_MANUAL_KEY);
  }
  // Disparar evento customizado para notificar mudança
  window.dispatchEvent(new CustomEvent('manualOfflineChange', { detail: { enabled } }));
}

export function isManualOfflineMode(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(OFFLINE_MANUAL_KEY) === 'true';
}

// Verificar se está online (considera modo manual e status real da conexão)
export function isOnline(): boolean {
  if (typeof window === 'undefined') return true;
  // Se o modo offline manual estiver ativado, sempre retornar false
  if (isManualOfflineMode()) {
    return false;
  }
  // Caso contrário, verificar o status real da conexão
  return navigator.onLine;
}

// Listener para mudanças de status online/offline (incluindo modo manual)
export function onOnlineStatusChange(callback: (online: boolean) => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleOnline = () => {
    // Só considerar online se não estiver em modo manual
    callback(!isManualOfflineMode());
  };
  
  const handleOffline = () => callback(false);
  
  const handleManualChange = (event: CustomEvent) => {
    // Se o modo manual foi desativado, verificar status real
    if (!event.detail.enabled) {
      callback(navigator.onLine);
    } else {
      callback(false);
    }
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  window.addEventListener('manualOfflineChange', handleManualChange as EventListener);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    window.removeEventListener('manualOfflineChange', handleManualChange as EventListener);
  };
}
