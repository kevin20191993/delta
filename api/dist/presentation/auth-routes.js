"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthRoutes = createAuthRoutes;
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function createAuthRoutes() {
    const router = (0, express_1.Router)();
    router.post('/api/auth/login', (req, res) => {
        const { username, password } = req.body ?? {};
        const validUser = process.env.ADMIN_USER || 'admin';
        const validPass = process.env.ADMIN_PASSWORD || 'changeme';
        if (typeof username !== 'string' ||
            typeof password !== 'string' ||
            username !== validUser ||
            password !== validPass) {
            res.status(401).json({ error: 'Credenciales incorrectas' });
            return;
        }
        const secret = process.env.JWT_SECRET || 'changeme-set-jwt-secret-in-env';
        const token = jsonwebtoken_1.default.sign({ user: username }, secret, { expiresIn: '8h' });
        res.json({ token, user: username });
    });
    return router;
}
//# sourceMappingURL=auth-routes.js.map