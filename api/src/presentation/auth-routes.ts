import { Router } from 'express';
import jwt from 'jsonwebtoken';

export function createAuthRoutes(): Router {
  const router = Router();

  router.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body ?? {};

    const validUser = process.env.ADMIN_USER || 'admin';
    const validPass = process.env.ADMIN_PASSWORD || 'changeme';

    if (
      typeof username !== 'string' ||
      typeof password !== 'string' ||
      username !== validUser ||
      password !== validPass
    ) {
      res.status(401).json({ error: 'Credenciales incorrectas' });
      return;
    }

    const secret = process.env.JWT_SECRET || 'changeme-set-jwt-secret-in-env';
    const token = jwt.sign({ user: username }, secret, { expiresIn: '8h' });
    res.json({ token, user: username });
  });

  return router;
}
