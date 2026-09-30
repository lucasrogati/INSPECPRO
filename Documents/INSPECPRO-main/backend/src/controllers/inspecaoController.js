const { pool } = require('../config/db');
const { STATUS_INSPECAO } = require('../utils/validators');

// Campos trazidos via JOIN para dar contexto útil sobre o prédio e o responsável,
// sem precisar de uma segunda requisição no frontend.
const SELECT_BASE = `
  SELECT
    i.id, i.predio_id, i.usuario_id, i.data_inspecao, i.observacoes, i.status,
    i.created_at, i.updated_at,
    p.nome AS predio_nome, p.endereco AS predio_endereco, p.tipo AS predio_tipo,
    u.nome AS responsavel_nome, u.email AS responsavel_email, u.tipo AS responsavel_tipo
  FROM inspecoes i
  JOIN predios p ON p.id = i.predio_id
  JOIN usuarios u ON u.id = i.usuario_id
`;

/**
 * GET /api/inspecoes
 * Filtros suportados: predio_id, usuario_id, status, data_inicio, data_fim.
 */
async function listar(req, res) {
  const { predio_id, usuario_id, status, data_inicio, data_fim } = req.query;
  const condicoes = [];
  const valores = [];

  if (predio_id) {
    condicoes.push('i.predio_id = ?');
    valores.push(predio_id);
  }
  if (usuario_id) {
    condicoes.push('i.usuario_id = ?');
    valores.push(usuario_id);
  }
  if (status) {
    condicoes.push('i.status = ?');
    valores.push(status);
  }
  if (data_inicio) {
    condicoes.push('i.data_inspecao >= ?');
    valores.push(data_inicio);
  }
  if (data_fim) {
    condicoes.push('i.data_inspecao <= ?');
    valores.push(data_fim);
  }

  const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `${SELECT_BASE} ${where} ORDER BY i.data_inspecao DESC, i.id DESC`,
    valores
  );
  res.json(rows);
}

/**
 * GET /api/inspecoes/:id
 */
async function obter(req, res) {
  const [rows] = await pool.query(`${SELECT_BASE} WHERE i.id = ?`, [req.params.id]);
  if (rows.length === 0) {
    return res.status(404).json({ message: 'Inspeção não encontrada.' });
  }
  res.json(rows[0]);
}

/**
 * POST /api/inspecoes
 */
async function criar(req, res) {
  const { predio_id, data_inspecao, observacoes, status } = req.body;
  // Se usuario_id não for informado, assume o próprio usuário autenticado como responsável.
  const usuario_id = req.body.usuario_id || req.usuario.id;

  if (!predio_id || !usuario_id || !data_inspecao) {
    return res.status(400).json({ message: 'Prédio, responsável e data da inspeção são obrigatórios.' });
  }
  if (status && !STATUS_INSPECAO.includes(status)) {
    return res.status(400).json({ message: `Status inválido. Use um de: ${STATUS_INSPECAO.join(', ')}.` });
  }

  const [predio] = await pool.query('SELECT id FROM predios WHERE id = ?', [predio_id]);
  if (predio.length === 0) {
    return res.status(404).json({ message: 'Prédio informado não existe.' });
  }

  const [usuario] = await pool.query('SELECT id FROM usuarios WHERE id = ? AND ativo = 1', [usuario_id]);
  if (usuario.length === 0) {
    return res.status(404).json({ message: 'Responsável informado não existe ou está inativo.' });
  }

  const [resultado] = await pool.query(
    'INSERT INTO inspecoes (predio_id, usuario_id, data_inspecao, observacoes, status) VALUES (?, ?, ?, ?, ?)',
    [predio_id, usuario_id, data_inspecao, observacoes || null, status || 'planejada']
  );

  const [rows] = await pool.query(`${SELECT_BASE} WHERE i.id = ?`, [resultado.insertId]);
  res.status(201).json(rows[0]);
}

/**
 * PUT /api/inspecoes/:id
 */
async function atualizar(req, res) {
  const { id } = req.params;
  const { predio_id, usuario_id, data_inspecao, observacoes, status } = req.body;

  const [existentes] = await pool.query('SELECT * FROM inspecoes WHERE id = ?', [id]);
  if (existentes.length === 0) {
    return res.status(404).json({ message: 'Inspeção não encontrada.' });
  }
  const atual = existentes[0];

  if (status && !STATUS_INSPECAO.includes(status)) {
    return res.status(400).json({ message: `Status inválido. Use um de: ${STATUS_INSPECAO.join(', ')}.` });
  }

  if (predio_id) {
    const [predio] = await pool.query('SELECT id FROM predios WHERE id = ?', [predio_id]);
    if (predio.length === 0) {
      return res.status(404).json({ message: 'Prédio informado não existe.' });
    }
  }

  if (usuario_id) {
    const [usuario] = await pool.query('SELECT id FROM usuarios WHERE id = ? AND ativo = 1', [usuario_id]);
    if (usuario.length === 0) {
      return res.status(404).json({ message: 'Responsável informado não existe ou está inativo.' });
    }
  }

  await pool.query(
    'UPDATE inspecoes SET predio_id = ?, usuario_id = ?, data_inspecao = ?, observacoes = ?, status = ? WHERE id = ?',
    [
      predio_id ?? atual.predio_id,
      usuario_id ?? atual.usuario_id,
      data_inspecao ?? atual.data_inspecao,
      observacoes ?? atual.observacoes,
      status ?? atual.status,
      id,
    ]
  );

  const [rows] = await pool.query(`${SELECT_BASE} WHERE i.id = ?`, [id]);
  res.json(rows[0]);
}

/**
 * PATCH /api/inspecoes/:id/status
 * Endpoint dedicado para transição rápida de status (ex: Kanban, ação em cartão da listagem).
 */
async function alterarStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !STATUS_INSPECAO.includes(status)) {
    return res.status(400).json({ message: `Status inválido. Use um de: ${STATUS_INSPECAO.join(', ')}.` });
  }

  const [resultado] = await pool.query('UPDATE inspecoes SET status = ? WHERE id = ?', [status, id]);
  if (resultado.affectedRows === 0) {
    return res.status(404).json({ message: 'Inspeção não encontrada.' });
  }

  const [rows] = await pool.query(`${SELECT_BASE} WHERE i.id = ?`, [id]);
  res.json(rows[0]);
}

/**
 * DELETE /api/inspecoes/:id
 */
async function remover(req, res) {
  const { id } = req.params;
  const [resultado] = await pool.query('DELETE FROM inspecoes WHERE id = ?', [id]);
  if (resultado.affectedRows === 0) {
    return res.status(404).json({ message: 'Inspeção não encontrada.' });
  }
  res.json({ message: 'Inspeção removida com sucesso.' });
}

module.exports = { listar, obter, criar, atualizar, alterarStatus, remover };
