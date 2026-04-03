"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthRoutes = createAuthRoutes;
const crypto_1 = require("crypto");
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mailer_1 = require("../auth/mailer");
const password_1 = require("../auth/password");
const auth_repository_1 = require("../infrastructure/mysql/auth-repository");
function getBaseUrl(req) {
    if (process.env.APP_BASE_URL) {
        return process.env.APP_BASE_URL.replace(/\/+$/, '');
    }
    const forwardedProto = req.get('x-forwarded-proto');
    const protocol = forwardedProto || req.protocol || 'https';
    const host = req.get('host');
    return `${protocol}://${host}`;
}
function signToken(user) {
    const secret = process.env.JWT_SECRET || 'changeme-set-jwt-secret-in-env';
    return jsonwebtoken_1.default.sign({
        sub: String(user.id),
        username: user.username,
        email: user.email,
        role: user.role
    }, secret, { expiresIn: '8h' });
}
function createAuthRoutes() {
    const router = (0, express_1.Router)();
    const authRepo = new auth_repository_1.MySqlAuthRepository();
    router.post('/api/auth/login', async (req, res) => {
        try {
            const { username, password } = req.body ?? {};
            if (typeof username !== 'string' ||
                typeof password !== 'string' ||
                !username.trim() ||
                !password) {
                res.status(401).json({ error: 'Credenciales incorrectas' });
                return;
            }
            const user = await authRepo.findByLogin(username);
            if (!user || !user.isActive || !(0, password_1.verifyPassword)(password, user.passwordHash)) {
                res.status(401).json({ error: 'Credenciales incorrectas' });
                return;
            }
            res.json({
                token: signToken(user),
                user: user.username,
                email: user.email,
                role: user.role
            });
        }
        catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'No fue posible iniciar sesión' });
        }
    });
    router.post('/api/auth/forgot-password', async (req, res) => {
        try {
            const { email } = req.body ?? {};
            if (typeof email !== 'string' || !email.trim()) {
                res.status(400).json({ error: 'Ingresa un correo electrónico válido' });
                return;
            }
            const user = await authRepo.findByEmail(email);
            if (!user || !user.isActive) {
                res.json({
                    message: 'Si el correo existe, enviaremos una liga para restablecer la contraseña.'
                });
                return;
            }
            const rawToken = (0, crypto_1.randomBytes)(32).toString('hex');
            const tokenHash = (0, password_1.hashResetToken)(rawToken);
            const ttlMinutes = parseInt(process.env.RESET_TOKEN_TTL_MINUTES || '60', 10);
            const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
            const resetUrl = `${getBaseUrl(req)}/cotizador/reset-password?token=${rawToken}`;
            await authRepo.createPasswordResetToken(user.id, tokenHash, expiresAt);
            await (0, mailer_1.sendMail)({
                to: user.email,
                subject: 'Restablece tu contraseña de KP Delta',
                text: [
                    `Hola ${user.username},`,
                    '',
                    'Recibimos una solicitud para restablecer tu contraseña del cotizador.',
                    `Abre esta liga para crear una nueva contraseña: ${resetUrl}`,
                    '',
                    `La liga vencerá en ${ttlMinutes} minutos.`,
                    'Si no solicitaste este cambio, puedes ignorar este correo.'
                ].join('\n')
            });
            res.json({
                message: 'Te enviamos una liga para restablecer tu contraseña.',
                ...(process.env.NODE_ENV !== 'production' ? { resetUrl } : {})
            });
        }
        catch (error) {
            console.error('Forgot password error:', error);
            res.status(500).json({ error: 'No fue posible enviar el correo de recuperación' });
        }
    });
    router.get('/api/auth/reset-password/:token', async (req, res) => {
        try {
            const token = req.params.token;
            if (!token) {
                res.status(400).json({ error: 'Token inválido' });
                return;
            }
            const record = await authRepo.findValidResetToken((0, password_1.hashResetToken)(token));
            if (!record) {
                res.status(404).json({ error: 'La liga ya no es válida o expiró' });
                return;
            }
            res.json({
                email: record.email,
                expiresAt: record.expiresAt
            });
        }
        catch (error) {
            console.error('Validate reset token error:', error);
            res.status(500).json({ error: 'No fue posible validar la liga de recuperación' });
        }
    });
    router.post('/api/auth/reset-password', async (req, res) => {
        try {
            const { token, password, confirmPassword } = req.body ?? {};
            if (typeof token !== 'string' ||
                typeof password !== 'string' ||
                typeof confirmPassword !== 'string') {
                res.status(400).json({ error: 'Datos incompletos para restablecer la contraseña' });
                return;
            }
            if (password.length < 8) {
                res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres' });
                return;
            }
            if (password !== confirmPassword) {
                res.status(400).json({ error: 'Las contraseñas no coinciden' });
                return;
            }
            const updated = await authRepo.consumePasswordResetToken((0, password_1.hashResetToken)(token), (0, password_1.hashPassword)(password));
            if (!updated) {
                res.status(400).json({ error: 'La liga ya no es válida o expiró' });
                return;
            }
            res.json({ message: 'Contraseña actualizada correctamente' });
        }
        catch (error) {
            console.error('Reset password error:', error);
            res.status(500).json({ error: 'No fue posible actualizar la contraseña' });
        }
    });
    return router;
}
//# sourceMappingURL=auth-routes.js.map