import { createJavaClient } from './api-client';
import type {
  Usuario,
  UsuarioCreateDTO,
  UsuarioUpdateDTO,
  LoginDTO,
  AuthResponseDTO,
  Evento,
  Inscricao,
  InscricaoCreateDTO,
  Presenca,
  PresencaCreateDTO,
  SyncDownloadDTO,
  SyncUploadDTO,
  SyncResponseDTO,
  LogAcesso,
  LogAcessoPage,
} from '@/types';

export class JavaClient {
  private client;

  constructor(getToken?: () => string | null) {
    this.client = createJavaClient(getToken);
  }

  // Auth
  async login(data: LoginDTO): Promise<AuthResponseDTO> {
    const response = await this.client.post<AuthResponseDTO>('/auth', data);
    return response.data;
  }

  // Usuários
  async createUsuario(data: UsuarioCreateDTO, offline = false): Promise<Usuario> {
    const response = await this.client.post<Usuario>('/usuarios', data, {
      params: { offline },
    });
    return response.data;
  }

  async getMe(): Promise<Usuario> {
    const response = await this.client.get<Usuario>('/usuarios/me');
    return response.data;
  }

  async updateMe(data: UsuarioUpdateDTO): Promise<Usuario> {
    const response = await this.client.put<Usuario>('/usuarios/me', data);
    return response.data;
  }

  async getUsuario(id: string): Promise<Usuario> {
    const response = await this.client.get<Usuario>(`/usuarios/${id}`);
    return response.data;
  }

  async updateUsuario(id: string, data: UsuarioUpdateDTO): Promise<Usuario> {
    const response = await this.client.put<Usuario>(`/usuarios/${id}`, data);
    return response.data;
  }

  // Eventos
  async listEventos(): Promise<Evento[]> {
    const response = await this.client.get<Evento[]>('/eventos');
    return response.data;
  }

  async getEvento(id: string): Promise<Evento> {
    const response = await this.client.get<Evento>(`/eventos/${id}`);
    return response.data;
  }

  // Inscrições
  async createInscricao(data: InscricaoCreateDTO): Promise<Inscricao> {
    const response = await this.client.post<Inscricao>('/inscricoes', data);
    return response.data;
  }

  async createInscricaoTerceiro(data: InscricaoCreateDTO): Promise<Inscricao> {
    const response = await this.client.post<Inscricao>('/inscricoes/terceiro', data);
    return response.data;
  }

  async getInscricao(id: string): Promise<Inscricao> {
    const response = await this.client.get<Inscricao>(`/inscricoes/${id}`);
    return response.data;
  }

  async getMinhasInscricoes(): Promise<Inscricao[]> {
    const response = await this.client.get<Inscricao[]>('/inscricoes/me');
    return response.data;
  }

  async getInscricoesUsuario(usuarioId: string): Promise<Inscricao[]> {
    const response = await this.client.get<Inscricao[]>(`/inscricoes/usuario/${usuarioId}`);
    return response.data;
  }

  async cancelarInscricao(id: string): Promise<void> {
    await this.client.delete(`/inscricoes/${id}`);
  }

  // Presenças
  async createPresenca(data: PresencaCreateDTO): Promise<Presenca> {
    const response = await this.client.post<Presenca>('/presencas', data);
    return response.data;
  }

  async createPresencaTerceiro(data: PresencaCreateDTO): Promise<Presenca> {
    const response = await this.client.post<Presenca>('/presencas/terceiro', data);
    return response.data;
  }

  async getPresencaPorInscricao(inscricaoId: string): Promise<Presenca | null> {
    try {
      const response = await this.client.get<Presenca>(`/presencas/inscricao/${inscricaoId}`);
      return response.data;
    } catch (err: any) {
      if (err.response?.status === 404) {
        return null;
      }
      throw err;
    }
  }

  // Sincronização
  async downloadSync(): Promise<SyncDownloadDTO> {
    const response = await this.client.post<SyncDownloadDTO>('/sync/download');
    return response.data;
  }

  async uploadSync(data: SyncUploadDTO): Promise<SyncResponseDTO> {
    const response = await this.client.post<SyncResponseDTO>('/sync/upload', data);
    return response.data;
  }

  // Logs
  async listarLogs(params?: {
    page?: number;
    size?: number;
    endpoint?: string;
    metodo?: string;
    usuarioId?: string;
    statusCode?: number;
    dataInicio?: string;
    dataFim?: string;
  }): Promise<LogAcessoPage> {
    const response = await this.client.get<LogAcessoPage>('/logs', { params });
    return response.data;
  }

  async buscarLog(id: string): Promise<LogAcesso> {
    const response = await this.client.get<LogAcesso>(`/logs/${id}`);
    return response.data;
  }

  async meusLogs(params?: {
    page?: number;
    size?: number;
  }): Promise<LogAcessoPage> {
    const response = await this.client.get<LogAcessoPage>('/logs/meus-logs', { params });
    return response.data;
  }
}

