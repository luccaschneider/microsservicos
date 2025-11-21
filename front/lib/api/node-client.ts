import { createNodeClient } from './api-client';
import type {
  Certificado,
  CertificadoCreateDTO,
  CertificadoValidacao,
} from '@/types';

export class NodeClient {
  private client;

  constructor(getToken?: () => string | null) {
    this.client = createNodeClient(getToken);
  }

  // Certificados
  async emitirCertificado(data: CertificadoCreateDTO): Promise<Certificado> {
    const response = await this.client.post<Certificado>('/certificados', data);
    return response.data;
  }

  async emitirCertificadoTerceiro(data: CertificadoCreateDTO): Promise<Certificado> {
    const response = await this.client.post<Certificado>('/certificados/terceiro', data);
    return response.data;
  }

  async getCertificado(id: string): Promise<Certificado> {
    const response = await this.client.get<Certificado>(`/certificados/${id}`);
    return response.data;
  }

  async getMeusCertificados(): Promise<Certificado[]> {
    const response = await this.client.get<Certificado[]>('/certificados/me');
    return response.data;
  }

  async getCertificadosUsuario(usuarioId: string): Promise<Certificado[]> {
    const response = await this.client.get<Certificado[]>(`/certificados/usuario/${usuarioId}`);
    return response.data;
  }

  // Validação pública (sem autenticação)
  async validarCertificado(codigo: string): Promise<CertificadoValidacao> {
    // Criar cliente sem token para endpoint público
    const publicClient = createNodeClient();
    const response = await publicClient.get<CertificadoValidacao>(`/certificados/validar/${codigo}`);
    return response.data;
  }
}

