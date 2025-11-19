import { pool } from '../config/database';
import { Certificado, CertificadoDTO, CertificadoValidacaoDTO, Inscricao, Usuario, Evento } from '../types/certificado';
import { v4 as uuidv4 } from 'uuid';

export class CertificadoService {
  private generateCodigoUnico(): string {
    return uuidv4().replace(/-/g, '').toUpperCase();
  }

  private generateUrlValidacao(codigo: string): string {
    const port = process.env.PORT || '8081';
    const address = process.env.SERVER_ADDRESS || 'localhost';
    return `http://${address}:${port}/certificados/validar/${codigo}`;
  }

  async emitirCertificado(inscricaoId: string): Promise<CertificadoDTO> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Verificar se já existe certificado para esta inscrição
      const existingCert = await client.query(
        'SELECT id FROM certificados WHERE inscricao_id = $1',
        [inscricaoId]
      );

      if (existingCert.rows.length > 0) {
        throw new Error('Certificado já foi emitido para esta inscrição');
      }

      // Buscar inscrição
      const inscricaoResult = await client.query<Inscricao>(
        `SELECT id, usuario_id, evento_id, cancelada 
         FROM inscricoes 
         WHERE id = $1`,
        [inscricaoId]
      );

      if (inscricaoResult.rows.length === 0) {
        throw new Error('Inscrição não encontrada');
      }

      const inscricao = inscricaoResult.rows[0];

      if (inscricao.cancelada) {
        throw new Error('Não é possível emitir certificado para inscrição cancelada');
      }

      // Buscar usuário
      const usuarioResult = await client.query<Usuario>(
        'SELECT id, nome FROM usuarios WHERE id = $1',
        [inscricao.usuario_id]
      );

      if (usuarioResult.rows.length === 0) {
        throw new Error('Usuário não encontrado');
      }

      const usuario = usuarioResult.rows[0];

      // Buscar evento e template
      const eventoResult = await client.query<Evento>(
        'SELECT id, nome, template_certificado FROM eventos WHERE id = $1',
        [inscricao.evento_id]
      );

      if (eventoResult.rows.length === 0) {
        throw new Error('Evento não encontrado');
      }

      const evento = eventoResult.rows[0];

      // Gerar código único (garantir que seja único)
      let codigoUnico = this.generateCodigoUnico();
      let exists = true;
      while (exists) {
        const checkResult = await client.query(
          'SELECT id FROM certificados WHERE codigo_unico = $1',
          [codigoUnico]
        );
        exists = checkResult.rows.length > 0;
        if (exists) {
          codigoUnico = this.generateCodigoUnico();
        }
      }

      const urlValidacao = this.generateUrlValidacao(codigoUnico);
      const templateUsado = evento.template_certificado || '';

      // Inserir certificado
      const insertResult = await client.query<Certificado>(
        `INSERT INTO certificados (id, inscricao_id, codigo_unico, data_emissao, url_validacao, template_usado)
         VALUES ($1, $2, $3, NOW(), $4, $5)
         RETURNING *`,
        [uuidv4(), inscricaoId, codigoUnico, urlValidacao, templateUsado]
      );

      await client.query('COMMIT');

      const certificado = insertResult.rows[0];

      return {
        id: certificado.id,
        inscricaoId: certificado.inscricao_id,
        usuarioId: usuario.id,
        usuarioNome: usuario.nome,
        eventoId: evento.id,
        eventoNome: evento.nome,
        codigoUnico: certificado.codigo_unico,
        dataEmissao: certificado.data_emissao.toISOString(),
        urlValidacao: certificado.url_validacao,
        templateUsado: certificado.template_usado,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async buscarPorId(id: string): Promise<CertificadoDTO> {
    const result = await pool.query<Certificado>(
      `SELECT c.*, i.usuario_id, i.evento_id, u.nome as usuario_nome, e.nome as evento_nome
       FROM certificados c
       INNER JOIN inscricoes i ON c.inscricao_id = i.id
       INNER JOIN usuarios u ON i.usuario_id = u.id
       INNER JOIN eventos e ON i.evento_id = e.id
       WHERE c.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new Error('Certificado não encontrado');
    }

    const row = result.rows[0] as any;

    return {
      id: row.id,
      inscricaoId: row.inscricao_id,
      usuarioId: row.usuario_id,
      usuarioNome: row.usuario_nome,
      eventoId: row.evento_id,
      eventoNome: row.evento_nome,
      codigoUnico: row.codigo_unico,
      dataEmissao: row.data_emissao.toISOString(),
      urlValidacao: row.url_validacao,
      templateUsado: row.template_usado,
    };
  }

  async validarCertificado(codigo: string): Promise<CertificadoValidacaoDTO> {
    const result = await pool.query<Certificado>(
      `SELECT c.*, i.usuario_id, i.evento_id, u.nome as usuario_nome, e.nome as evento_nome
       FROM certificados c
       INNER JOIN inscricoes i ON c.inscricao_id = i.id
       INNER JOIN usuarios u ON i.usuario_id = u.id
       INNER JOIN eventos e ON i.evento_id = e.id
       WHERE c.codigo_unico = $1`,
      [codigo]
    );

    if (result.rows.length === 0) {
      return { valido: false };
    }

    const row = result.rows[0] as any;

    return {
      valido: true,
      certificadoId: row.id,
      inscricaoId: row.inscricao_id,
      usuarioNome: row.usuario_nome,
      eventoNome: row.evento_nome,
      dataEmissao: row.data_emissao.toISOString(),
      codigoUnico: row.codigo_unico,
    };
  }

  async buscarPorUsuario(usuarioId: string): Promise<CertificadoDTO[]> {
    const result = await pool.query<any>(
      `SELECT c.*, i.usuario_id, i.evento_id, u.nome as usuario_nome, e.nome as evento_nome
       FROM certificados c
       INNER JOIN inscricoes i ON c.inscricao_id = i.id
       INNER JOIN usuarios u ON i.usuario_id = u.id
       INNER JOIN eventos e ON i.evento_id = e.id
       WHERE i.usuario_id = $1
       ORDER BY c.data_emissao DESC`,
      [usuarioId]
    );

    return result.rows.map((row) => ({
      id: row.id,
      inscricaoId: row.inscricao_id,
      usuarioId: row.usuario_id,
      usuarioNome: row.usuario_nome,
      eventoId: row.evento_id,
      eventoNome: row.evento_nome,
      codigoUnico: row.codigo_unico,
      dataEmissao: row.data_emissao.toISOString(),
      urlValidacao: row.url_validacao,
      templateUsado: row.template_usado,
    }));
  }
}



