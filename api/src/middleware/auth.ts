import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  authUser?: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No autorizado' });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const secret = process.env.JWT_SECRET || 'changeme-set-jwt-secret-in-env';
    const decoded = jwt.verify(token, secret) as {
      sub?: string;
      username?: string;
      email?: string;
      role?: string;
    };
    (req as AuthenticatedRequest).authUser = {
      id: decoded.sub || '',
      username: decoded.username || '',
      email: decoded.email || '',
      role: decoded.role || 'admin'
    };
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}
