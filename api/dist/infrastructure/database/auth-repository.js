"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostgresAuthRepository = void 0;
const crypto_1 = require("crypto");
const connection_1 = require("./connection");
const password_1 = require("../../auth/password");
function mapAuthUser(row) {
    return {
        id: row.id,
        username: row.username,
        email: row.email,
        passwordHash: row.password_hash,
        role: row.role,
        isActive: row.is_active
    };
}
class PostgresAuthRepository {
    async ensureSchema() {
        const pool = (0, connection_1.getPool)();
        await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY,
        username varchar(80) NOT NULL UNIQUE,
        email varchar(160) NOT NULL UNIQUE,
        password_hash text NOT NULL,
        role varchar(40) NOT NULL DEFAULT 'admin',
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
        await pool.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id uuid PRIMARY KEY,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash varchar(64) NOT NULL UNIQUE,
        expires_at timestamptz NOT NULL,
        used_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
        await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)
    `);
        await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
    `);
        await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id)
    `);
    }
    async ensureDefaultAdminUser(config) {
        const pool = (0, connection_1.getPool)();
        const countResult = await pool.query('SELECT COUNT(*)::int AS count FROM users');
        if ((countResult.rows[0]?.count || 0) > 0) {
            return;
        }
        await pool.query(`
        INSERT INTO users (id, username, email, password_hash, role, is_active)
        VALUES ($1, $2, $3, $4, 'admin', true)
      `, [
            (0, crypto_1.randomUUID)(),
            config.username.trim().toLowerCase(),
            config.email.trim().toLowerCase(),
            (0, password_1.hashPassword)(config.password)
        ]);
    }
    async findByLogin(login) {
        const pool = (0, connection_1.getPool)();
        const normalized = login.trim().toLowerCase();
        const result = await pool.query(`
        SELECT id, username, email, password_hash, role, is_active
        FROM users
        WHERE username = $1 OR email = $1
        LIMIT 1
      `, [normalized]);
        if (result.rowCount === 0) {
            return null;
        }
        return mapAuthUser(result.rows[0]);
    }
    async findByEmail(email) {
        const pool = (0, connection_1.getPool)();
        const normalized = email.trim().toLowerCase();
        const result = await pool.query(`
        SELECT id, username, email, password_hash, role, is_active
        FROM users
        WHERE email = $1
        LIMIT 1
      `, [normalized]);
        if (result.rowCount === 0) {
            return null;
        }
        return mapAuthUser(result.rows[0]);
    }
    async createPasswordResetToken(userId, tokenHash, expiresAt) {
        const pool = (0, connection_1.getPool)();
        await pool.query(`
        UPDATE password_reset_tokens
        SET used_at = now()
        WHERE user_id = $1
          AND used_at IS NULL
      `, [userId]);
        await pool.query(`
        INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at)
        VALUES ($1, $2, $3, $4)
      `, [(0, crypto_1.randomUUID)(), userId, tokenHash, expiresAt]);
    }
    async findValidResetToken(tokenHash) {
        const pool = (0, connection_1.getPool)();
        const result = await pool.query(`
        SELECT prt.id, prt.user_id, prt.expires_at, u.email
        FROM password_reset_tokens prt
        INNER JOIN users u ON u.id = prt.user_id
        WHERE prt.token_hash = $1
          AND prt.used_at IS NULL
          AND prt.expires_at > now()
          AND u.is_active = true
        LIMIT 1
      `, [tokenHash]);
        if (result.rowCount === 0) {
            return null;
        }
        return {
            id: result.rows[0].id,
            userId: result.rows[0].user_id,
            email: result.rows[0].email,
            expiresAt: result.rows[0].expires_at
        };
    }
    async consumePasswordResetToken(tokenHash, nextPasswordHash) {
        const pool = (0, connection_1.getPool)();
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const tokenResult = await client.query(`
          SELECT id, user_id
          FROM password_reset_tokens
          WHERE token_hash = $1
            AND used_at IS NULL
            AND expires_at > now()
          FOR UPDATE
        `, [tokenHash]);
            if (tokenResult.rowCount === 0) {
                await client.query('ROLLBACK');
                return false;
            }
            const tokenRow = tokenResult.rows[0];
            await client.query(`
          UPDATE users
          SET password_hash = $1, updated_at = now()
          WHERE id = $2
        `, [nextPasswordHash, tokenRow.user_id]);
            await client.query(`
          UPDATE password_reset_tokens
          SET used_at = now()
          WHERE user_id = $1
            AND used_at IS NULL
        `, [tokenRow.user_id]);
            await client.query('COMMIT');
            return true;
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
}
exports.PostgresAuthRepository = PostgresAuthRepository;
//# sourceMappingURL=auth-repository.js.map