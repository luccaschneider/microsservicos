import { JavaClient } from '@/lib/api/java-client';
import {
  saveInscricaoOffline,
  savePresencaOffline,
  saveUsuarioOffline,
  getInscricoesNaoSincronizadas,
  getPresencasNaoSincronizadas,
  getUsuariosNaoSincronizados,
  markInscricaoSincronizada,
  markPresencaSincronizada,
  markUsuarioSincronizado,
  removeInscricaoOffline,
  removePresencaOffline,
  removeUsuarioOffline,
  isOnline,
} from '@/lib/storage/offline-storage';
import type {
  InscricaoSyncDTO,
  PresencaSyncDTO,
  UsuarioSyncDTO,
  SyncUploadDTO,
  SyncResponseDTO,
} from '@/types';

export class SyncService {
  private javaClient: JavaClient;
  private getUserId: (() => string | null) | null = null;

  constructor(getToken: () => string | null, getUserId?: () => string | null) {
    this.javaClient = new JavaClient(getToken);
    this.getUserId = getUserId || null;
  }

  async syncOfflineData(): Promise<SyncResponseDTO> {
    if (!isOnline()) {
      throw new Error('Não há conexão com a internet');
    }

    const usuariosOffline = await getUsuariosNaoSincronizados();
    const inscricoesOffline = await getInscricoesNaoSincronizadas();
    const presencasOffline = await getPresencasNaoSincronizadas();

    if (usuariosOffline.length === 0 && inscricoesOffline.length === 0 && presencasOffline.length === 0) {
      return {
        mensagem: 'Nenhum dado pendente para sincronizar',
        usuariosProcessados: 0,
        inscricoesProcessadas: 0,
        presencasProcessadas: 0,
      };
    }

    // Função auxiliar para validar/converter ID para UUID
    const toUUIDOrNull = (id: string): string | null => {
      // Se já é um UUID válido, retornar como está
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(id)) {
        return id;
      }
      // Se não é UUID válido, retornar null para o backend gerar um novo
      return null;
    };

    // Converter dados offline para formato de sincronização
    const usuariosSync: UsuarioSyncDTO[] = usuariosOffline
      .filter((item) => !item.sincronizado)
      .map((item) => {
        const validId = toUUIDOrNull(item.id);
        // IMPORTANTE: Incluir a senha para o backend fazer hash
        if (!item.data.senha) {
          console.warn('Usuário offline sem senha, pulando sincronização:', item.id);
          return null;
        }
        return {
          id: validId as any, // null se inválido, backend vai gerar novo
          nome: item.data.nome,
          email: item.data.email,
          senha: item.data.senha, // Senha em texto plano - backend fará hash
          telefone: item.data.telefone,
          cpf: item.data.cpf,
          dadosCompletos: item.data.dadosCompletos || false,
          criadoOffline: true,
          dataCriacao: new Date(item.timestamp).toISOString(),
        };
      })
      .filter((item) => item !== null && item.id !== null) as UsuarioSyncDTO[]; // Remover se ID inválido ou sem senha

    const usuarioIdLogado = this.getUserId ? this.getUserId() : null;
    const usuarioIdLogadoUUID = usuarioIdLogado ? toUUIDOrNull(usuarioIdLogado) : null;

    const inscricoesSync: InscricaoSyncDTO[] = inscricoesOffline
      .filter((item) => !item.sincronizado)
      .map((item) => {
        const validId = toUUIDOrNull(item.id);
        // IMPORTANTE: Usar o timestamp do momento offline, não a data atual
        // Esta data será preservada e usada no email para mostrar quando a inscrição realmente aconteceu
        const dataOriginal = new Date(item.timestamp).toISOString();
        
        // Se a inscrição tem usuarioId (inscrição de terceiro), usar ele
        // Caso contrário, usar o usuário logado
        const inscricaoUsuarioId = item.data.usuarioId 
          ? toUUIDOrNull(item.data.usuarioId) 
          : usuarioIdLogadoUUID;
        
        return {
          id: validId as any, // null se inválido, backend vai gerar novo
          usuarioId: inscricaoUsuarioId as any, // Usar usuarioId da inscrição ou usuário logado
          eventoId: item.data.eventoId,
          dataInscricao: dataOriginal, // Data do momento offline
          cancelada: false,
          criadaOffline: true,
          dataCriacao: dataOriginal, // Data do momento offline
        };
      })
      .filter((item) => item.id !== null); // Remover se ID inválido

    const presencasSync: PresencaSyncDTO[] = presencasOffline
      .filter((item) => !item.sincronizado)
      .map((item) => {
        const validId = toUUIDOrNull(item.id);
        const validInscricaoId = item.data.inscricaoId ? toUUIDOrNull(item.data.inscricaoId) : null;
        // IMPORTANTE: Usar o timestamp do momento offline, não a data atual
        // Esta data será preservada e usada no email para mostrar quando o check-in realmente aconteceu
        const dataOriginal = new Date(item.timestamp).toISOString();
        return {
          id: validId as any, // null se inválido, backend vai gerar novo
          inscricaoId: validInscricaoId as any, // null se inválido
          dataCheckIn: dataOriginal, // Data do momento offline
          criadaOffline: true,
          dataCriacao: dataOriginal, // Data do momento offline
        };
      })
      .filter((item) => item.id !== null && item.inscricaoId !== null); // Remover se IDs inválidos

    const uploadDTO: SyncUploadDTO = {
      usuarios: usuariosSync.length > 0 ? usuariosSync : undefined,
      inscricoes: inscricoesSync.length > 0 ? inscricoesSync : undefined,
      presencas: presencasSync.length > 0 ? presencasSync : undefined,
    };

    try {
      const response = await this.javaClient.uploadSync(uploadDTO);

      // Marcar como sincronizado
      for (const usuario of usuariosOffline) {
        await markUsuarioSincronizado(usuario.id);
      }

      for (const inscricao of inscricoesOffline) {
        await markInscricaoSincronizada(inscricao.id);
      }

      for (const presenca of presencasOffline) {
        await markPresencaSincronizada(presenca.id);
      }

      return response;
    } catch (error: any) {
      console.error('Erro ao sincronizar:', error);
      throw error;
    }
  }

  async saveInscricaoOffline(inscricaoData: { eventoId: string; usuarioId?: string }): Promise<string> {
    return await saveInscricaoOffline(inscricaoData);
  }

  async savePresencaOffline(
    presencaData: { inscricaoId?: string; eventoId?: string },
    inscricaoId: string
  ): Promise<string> {
    return await savePresencaOffline(presencaData, inscricaoId);
  }

  async saveUsuarioOffline(usuarioData: {
    nome: string;
    email: string;
    senha: string;
    telefone?: string;
  }): Promise<string> {
    return await saveUsuarioOffline(usuarioData);
  }
}
