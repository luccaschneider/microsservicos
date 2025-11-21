// Tipos baseados nos DTOs do backend Java e Node.js

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  cpf?: string;
  telefone?: string;
  dadosCompletos?: boolean;
  criadoOffline?: boolean;
  sincronizado?: boolean;
  dataCriacao?: string;
  dataAtualizacao?: string;
}

export interface UsuarioCreateDTO {
  nome: string;
  email: string;
  senha: string;
  telefone?: string;
}

export interface UsuarioUpdateDTO {
  nome?: string;
  cpf?: string;
  telefone?: string;
}

export interface LoginDTO {
  email: string;
  senha: string;
}

export interface AuthResponseDTO {
  token: string;
  usuario: Usuario;
  expiresIn: number;
}

export interface Evento {
  id: string;
  nome: string;
  descricao?: string;
  dataInicio: string;
  dataFim: string;
  ativo?: boolean;
  templateCertificado?: string;
  dataCriacao?: string;
  dataAtualizacao?: string;
}

export interface Inscricao {
  id: string;
  usuarioId: string;
  usuarioNome?: string;
  usuarioEmail?: string;
  eventoId: string;
  eventoNome?: string;
  dataInscricao: string;
  cancelada?: boolean;
  dataCancelamento?: string;
  criadaOffline?: boolean;
  sincronizado?: boolean;
  dataCriacao?: string;
  dataAtualizacao?: string;
}

export interface InscricaoCreateDTO {
  usuarioId?: string;
  eventoId: string;
  offline?: boolean;
}

export interface Presenca {
  id: string;
  inscricaoId: string;
  usuarioId: string;
  usuarioNome?: string;
  eventoId: string;
  eventoNome?: string;
  dataCheckIn: string;
  criadaOffline?: boolean;
  sincronizado?: boolean;
  dataCriacao?: string;
}

export interface PresencaCreateDTO {
  inscricaoId?: string;
  usuarioId?: string;
  eventoId?: string;
  offline?: boolean;
}

export interface Certificado {
  id: string;
  inscricaoId: string;
  usuarioId: string;
  usuarioNome: string;
  eventoId: string;
  eventoNome: string;
  codigoUnico: string;
  dataEmissao: string;
  urlValidacao: string;
  templateUsado?: string | null;
}

export interface CertificadoCreateDTO {
  inscricaoId: string;
}

export interface CertificadoValidacao {
  valido: boolean;
  certificadoId?: string;
  inscricaoId?: string;
  usuarioNome?: string;
  eventoNome?: string;
  dataEmissao?: string;
  codigoUnico?: string;
}

export interface SyncDownloadDTO {
  eventos: Evento[];
  usuarios: Usuario[];
  inscricoes: Inscricao[];
  presencas: Presenca[];
}

export interface SyncUploadDTO {
  usuarios?: UsuarioSyncDTO[];
  inscricoes?: InscricaoSyncDTO[];
  presencas?: PresencaSyncDTO[];
}

export interface UsuarioSyncDTO {
  id: string;
  nome: string;
  email: string;
  senha?: string;
  cpf?: string;
  telefone?: string;
  dadosCompletos?: boolean;
  criadoOffline?: boolean;
  dataCriacao?: string;
  dataAtualizacao?: string;
}

export interface InscricaoSyncDTO {
  id: string;
  usuarioId: string;
  eventoId: string;
  dataInscricao?: string;
  cancelada?: boolean;
  dataCancelamento?: string;
  criadaOffline?: boolean;
  dataCriacao?: string;
  dataAtualizacao?: string;
}

export interface PresencaSyncDTO {
  id: string;
  inscricaoId: string;
  dataCheckIn?: string;
  criadaOffline?: boolean;
  dataCriacao?: string;
}

export interface SyncResponseDTO {
  usuariosProcessados?: number;
  inscricoesProcessadas?: number;
  presencasProcessadas?: number;
  erros?: number;
  mensagem?: string;
}

export interface ServiceStatus {
  java: boolean;
  node: boolean;
}

export interface LogAcesso {
  id: string;
  endpoint: string;
  metodo: string;
  usuarioId?: string;
  usuarioNome?: string;
  usuarioEmail?: string;
  timestamp: string;
  ip?: string;
  userAgent?: string;
  statusCode?: number;
  requestBody?: string;
  responseBody?: string;
  requestHeaders?: string;
  responseHeaders?: string;
}

export interface LogAcessoPage {
  content: LogAcesso[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

