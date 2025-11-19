export interface Certificado {
  id: string;
  inscricao_id: string;
  codigo_unico: string;
  data_emissao: Date;
  url_validacao: string;
  template_usado: string | null;
}

export interface CertificadoDTO {
  id: string;
  inscricaoId: string;
  usuarioId: string;
  usuarioNome: string;
  eventoId: string;
  eventoNome: string;
  codigoUnico: string;
  dataEmissao: string;
  urlValidacao: string;
  templateUsado: string | null;
}

export interface CertificadoCreateDTO {
  inscricaoId: string;
}

export interface CertificadoValidacaoDTO {
  valido: boolean;
  certificadoId?: string;
  inscricaoId?: string;
  usuarioNome?: string;
  eventoNome?: string;
  dataEmissao?: string;
  codigoUnico?: string;
}

export interface Inscricao {
  id: string;
  usuario_id: string;
  evento_id: string;
  cancelada: boolean;
}

export interface Usuario {
  id: string;
  nome: string;
}

export interface Evento {
  id: string;
  nome: string;
  template_certificado: string | null;
}



