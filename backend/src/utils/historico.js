/**
 * Registra uma entrada em historico_anomalia.
 * `executor` pode ser o pool ou uma conexão de transação (ambos têm .query).
 */
async function registrarHistorico(executor, { anomaliaId, usuarioId, descricao, statusAnterior = null, statusNovo = null }) {
  await executor.query(
    'INSERT INTO historico_anomalia (anomalia_id, usuario_id, descricao, status_anterior, status_novo) VALUES (?, ?, ?, ?, ?)',
    [anomaliaId, usuarioId, descricao || null, statusAnterior, statusNovo]
  );
}

/**
 * Muda o status de uma anomalia e registra no histórico (se realmente mudou).
 * Retorna true quando houve alteração.
 */
async function mudarStatusAnomalia(executor, { anomaliaId, usuarioId, novoStatus, descricao }) {
  const [rows] = await executor.query('SELECT status FROM anomalias WHERE id = ?', [anomaliaId]);
  if (rows.length === 0) return false;
  const anterior = rows[0].status;
  if (anterior === novoStatus) return false;

  await executor.query('UPDATE anomalias SET status = ? WHERE id = ?', [novoStatus, anomaliaId]);
  await registrarHistorico(executor, {
    anomaliaId,
    usuarioId,
    descricao,
    statusAnterior: anterior,
    statusNovo: novoStatus,
  });
  return true;
}

module.exports = { registrarHistorico, mudarStatusAnomalia };
