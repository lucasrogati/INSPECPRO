const { pool } = require('../config/db');

/**
 * Executa `fn(conn)` dentro de uma transação MySQL.
 * Faz commit se tudo der certo; rollback e re-lança o erro caso contrário.
 */
async function comTransacao(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const resultado = await fn(conn);
    await conn.commit();
    return resultado;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { comTransacao };
