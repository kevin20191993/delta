import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No autorizado' });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const secret = process.env.JWT_SECRET || 'changeme-set-jwt-secret-in-env';
    jwt.verify(token, secret);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}
