const mysql = require('mysql2/promise');
require('dotenv').config();

// Pool de conexões — reutilizado em toda a aplicação.
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'inspecpro',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true, // retorna DATE/DATETIME como string (evita problemas de timezone no front)
});

async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log('[db] Conexão com MySQL estabelecida com sucesso.');
    conn.release();
  } catch (err) {
    console.error('[db] Falha ao conectar ao MySQL:', err.message);
    process.exit(1);
  }
}

module.exports = { pool, testConnection };
