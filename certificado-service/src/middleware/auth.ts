import { Request, Response, NextFunction } from 'express';
import { validateToken, getUserIdFromToken } from '../config/jwt';

export interface AuthRequest extends Request {
  userId?: string;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const token = authHeader.substring(7);
    const payload = validateToken(token);

    if (!payload) {
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }

    req.userId = payload.sub;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Erro na autenticação' });
  }
}




