"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDb = initDb;
exports.getPool = getPool;
exports.closeDb = closeDb;
const pg_1 = __importDefault(require("pg"));
const { Pool } = pg_1.default;
let pool = null;
async function initDb(config) {
    pool = new Pool({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database
    });
    pool.on('error', (err) => {
        console.error('Unexpected DB pool error:', err);
    });
    try {
        const result = await pool.query('SELECT NOW()');
        console.log('Database connection established:', result.rows[0]);
    }
    catch (err) {
        console.error('Failed to connect to database:', err);
        throw err;
    }
    return pool;
}
function getPool() {
    if (!pool) {
        throw new Error('Database pool not initialized. Call initDb first.');
    }
    return pool;
}
async function closeDb() {
    if (pool) {
        await pool.end();
        pool = null;
    }
}
//# sourceMappingURL=connection.js.map