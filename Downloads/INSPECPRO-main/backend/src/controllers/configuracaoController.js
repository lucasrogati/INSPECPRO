const { pool } = require('../config/db');

/**
 * GET /api/configuracoes/sistema
 * Visão geral do sistema para o administrador: volume de dados e informações de execução.
 */
async function sistema(req, res) {
  const [[c]] = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM usuarios WHERE ativo = 1) AS usuarios_ativos,
       (SELECT COUNT(*) FROM usuarios WHERE ativo = 0) AS usuarios_inativos,
       (SELECT COUNT(*) FROM predios) AS predios,
       (SELECT COUNT(*) FROM ambientes) AS ambientes,
       (SELECT COUNT(*) FROM inspecoes) AS inspecoes,
       (SELECT COUNT(*) FROM anomalias) AS anomalias,
       (SELECT COUNT(*) FROM fotos_anomalia) AS fotos,
       (SELECT COUNT(*) FROM manutencoes) AS manutencoes`
  );

  const contagens = Object.fromEntries(Object.entries(c).map(([k, v]) => [k, Number(v)]));

  res.json({
    contagens,
    ambiente: {
      node: process.version,
      ambiente: process.env.NODE_ENV || 'development',
      banco: process.env.DB_NAME || 'inspecpro',
      expiracao_token: process.env.JWT_EXPIRES_IN || '8h',
      uptime_segundos: Math.round(process.uptime()),
    },
  });
}

module.exports = { sistema };
