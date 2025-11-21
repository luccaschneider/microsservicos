import { Request, Response } from 'express';
import { CertificadoService } from '../services/certificado.service';
import { AuthRequest } from '../middleware/auth';
import { pool } from '../config/database';

const certificadoService = new CertificadoService();

export class CertificadoController {
  async buscarPorId(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const certificado = await certificadoService.buscarPorId(id);
      res.json(certificado);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  async emitirMeuCertificado(req: AuthRequest, res: Response) {
    try {
      const { inscricaoId } = req.body;
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      // Verificar se a inscrição pertence ao usuário logado
      const inscricaoResult = await pool.query(
        'SELECT usuario_id FROM inscricoes WHERE id = $1',
        [inscricaoId]
      );

      if (inscricaoResult.rows.length === 0) {
        return res.status(404).json({ error: 'Inscrição não encontrada' });
      }

      if (inscricaoResult.rows[0].usuario_id !== userId) {
        return res.status(403).json({ error: 'Inscrição não pertence ao usuário logado' });
      }

      const certificado = await certificadoService.emitirCertificado(inscricaoId);
      res.json(certificado);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async emitirCertificadoTerceiro(req: Request, res: Response) {
    try {
      const { inscricaoId } = req.body;
      const certificado = await certificadoService.emitirCertificado(inscricaoId);
      res.json(certificado);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async validarCertificado(req: Request, res: Response) {
    try {
      const { codigo } = req.params;
      const validacao = await certificadoService.validarCertificado(codigo);
      res.json(validacao);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async buscarMeusCertificados(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const certificados = await certificadoService.buscarPorUsuario(userId);
      res.json(certificados);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async buscarPorUsuario(req: Request, res: Response) {
    try {
      const { usuarioId } = req.params;
      const certificados = await certificadoService.buscarPorUsuario(usuarioId);
      res.json(certificados);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}




