"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySqlAuthRepository = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const password_1 = require("../../auth/password");
function createPool() {
    return promise_1.default.createPool({
        host: process.env.AUTH_DB_HOST || '127.0.0.1',
        port: parseInt(process.env.AUTH_DB_PORT || '3306', 10),
        user: process.env.AUTH_DB_USER || 'kpdelta_db',
        password: process.env.AUTH_DB_PASSWORD || '',
        database: process.env.AUTH_DB_NAME || 'kpdelta_kpdelta',
        waitForConnections: true,
        connectionLimit: 10,
        namedPlaceholders: false
    });
}
let pool = null;
function getPool() {
    if (!pool) {
        pool = createPool();
    }
    return pool;
}
function mapAuthUser(row) {
    return {
        id: Number(row.id),
        username: String(row.username),
        email: String(row.email),
        passwordHash: String(row.password_hash),
        role: String(row.role),
        isActive: Boolean(row.is_active)
    };
}
class MySqlAuthRepository {
    async ensureSchema() {
        const db = getPool();
        await db.execute(`
      CREATE TABLE IF NOT EXISTS cotizador_users (
        id bigint unsigned NOT NULL AUTO_INCREMENT,
        username varchar(80) NOT NULL,
        email varchar(160) NOT NULL,
        password_hash text NOT NULL,
        role varchar(40) NOT NULL DEFAULT 'admin',
        is_active tinyint(1) NOT NULL DEFAULT 1,
        created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uniq_cotizador_users_username (username),
        UNIQUE KEY uniq_cotizador_users_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
        await db.execute(`
      CREATE TABLE IF NOT EXISTS cotizador_password_reset_tokens (
        id bigint unsigned NOT NULL AUTO_INCREMENT,
        user_id bigint unsigned NOT NULL,
        token_hash varchar(64) NOT NULL,
        expires_at datetime NOT NULL,
        used_at datetime DEFAULT NULL,
        created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uniq_cotizador_reset_token_hash (token_hash),
        KEY idx_cotizador_reset_user_id (user_id),
        CONSTRAINT fk_cotizador_reset_user
          FOREIGN KEY (user_id) REFERENCES cotizador_users (id)
          ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    }
    async ensureDefaultAdminUser(config) {
        const db = getPool();
        const [rows] = await db.query('SELECT COUNT(*) AS count FROM cotizador_users');
        const count = Number(rows[0]?.count || 0);
        if (count > 0) {
            return;
        }
        await db.execute(`
        INSERT INTO cotizador_users (username, email, password_hash, role, is_active)
        VALUES (?, ?, ?, 'admin', 1)
      `, [
            config.username.trim().toLowerCase(),
            config.email.trim().toLowerCase(),
            (0, password_1.hashPassword)(config.password)
        ]);
    }
    async listUsers() {
        const db = getPool();
        const [rows] = await db.query(`
        SELECT id, username, email, role, is_active
        FROM cotizador_users
        ORDER BY username ASC
      `);
        return rows.map((row) => ({
            id: Number(row.id),
            username: String(row.username),
            email: String(row.email),
            role: String(row.role),
            isActive: Boolean(row.is_active)
        }));
    }
    async createUser(input) {
        const db = getPool();
        const [result] = await db.execute(`
        INSERT INTO cotizador_users (username, email, password_hash, role, is_active)
        VALUES (?, ?, ?, ?, 1)
      `, [input.username.trim().toLowerCase(), input.email.trim().toLowerCase(), input.passwordHash, input.role]);
        return {
            id: Number(result.insertId),
            username: input.username.trim().toLowerCase(),
            email: input.email.trim().toLowerCase(),
            role: input.role,
            isActive: true
        };
    }
    async findByLogin(login) {
        const db = getPool();
        const normalized = login.trim().toLowerCase();
        const [rows] = await db.execute(`
        SELECT id, username, email, password_hash, role, is_active
        FROM cotizador_users
        WHERE username = ? OR email = ?
        LIMIT 1
      `, [normalized, normalized]);
        if (!rows.length) {
            return null;
        }
        return mapAuthUser(rows[0]);
    }
    async findByEmail(email) {
        const db = getPool();
        const normalized = email.trim().toLowerCase();
        const [rows] = await db.execute(`
        SELECT id, username, email, password_hash, role, is_active
        FROM cotizador_users
        WHERE email = ?
        LIMIT 1
      `, [normalized]);
        if (!rows.length) {
            return null;
        }
        return mapAuthUser(rows[0]);
    }
    async createPasswordResetToken(userId, tokenHash, expiresAt) {
        const db = getPool();
        await db.execute(`
        UPDATE cotizador_password_reset_tokens
        SET used_at = NOW()
        WHERE user_id = ?
          AND used_at IS NULL
      `, [userId]);
        await db.execute(`
        INSERT INTO cotizador_password_reset_tokens (user_id, token_hash, expires_at)
        VALUES (?, ?, ?)
      `, [userId, tokenHash, expiresAt]);
    }
    async findValidResetToken(tokenHash) {
        const db = getPool();
        const [rows] = await db.execute(`
        SELECT prt.id, prt.user_id, prt.expires_at, u.email
        FROM cotizador_password_reset_tokens prt
        INNER JOIN cotizador_users u ON u.id = prt.user_id
        WHERE prt.token_hash = ?
          AND prt.used_at IS NULL
          AND prt.expires_at > NOW()
          AND u.is_active = 1
        LIMIT 1
      `, [tokenHash]);
        if (!rows.length) {
            return null;
        }
        return {
            id: Number(rows[0].id),
            userId: Number(rows[0].user_id),
            email: String(rows[0].email),
            expiresAt: new Date(rows[0].expires_at)
        };
    }
    async consumePasswordResetToken(tokenHash, nextPasswordHash) {
        const db = getPool();
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const [rows] = await connection.execute(`
          SELECT id, user_id
          FROM cotizador_password_reset_tokens
          WHERE token_hash = ?
            AND used_at IS NULL
            AND expires_at > NOW()
          LIMIT 1
          FOR UPDATE
        `, [tokenHash]);
            if (!rows.length) {
                await connection.rollback();
                return false;
            }
            const tokenRow = rows[0];
            await connection.execute(`
          UPDATE cotizador_users
          SET password_hash = ?, updated_at = NOW()
          WHERE id = ?
        `, [nextPasswordHash, tokenRow.user_id]);
            await connection.execute(`
          UPDATE cotizador_password_reset_tokens
          SET used_at = NOW()
          WHERE user_id = ?
            AND used_at IS NULL
        `, [tokenRow.user_id]);
            await connection.commit();
            return true;
        }
        catch (error) {
            await connection.rollback();
            throw error;
        }
        finally {
            connection.release();
        }
    }
}
exports.MySqlAuthRepository = MySqlAuthRepository;
//# sourceMappingURL=auth-repository.js.map