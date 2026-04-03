import pg from 'pg';

const { Pool } = pg;

export interface DbConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

let pool: pg.Pool | null = null;

export async function initDb(config: DbConfig): Promise<pg.Pool> {
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
  } catch (err) {
    console.error('Failed to connect to database:', err);
    throw err;
  }

  return pool;
}

export function getPool(): pg.Pool {
  if (!pool) {
    throw new Error('Database pool not initialized. Call initDb first.');
  }
  return pool;
}

export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
