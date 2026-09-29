const { pool } = require('../config/db');

/**
 * GET /api/ambientes?predio_id=1
 */
async function listar(req, res) {
  const { predio_id } = req.query;
  const condicoes = [];
  const valores = [];

  if (predio_id) {
    condicoes.push('predio_id = ?');
    valores.push(predio_id);
  }
  const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `SELECT * FROM ambientes ${where} ORDER BY bloco, andar, nome`,
    valores
  );
  res.json(rows);
}

/**
 * GET /api/ambientes/:id
 */
async function obter(req, res) {
  const [rows] = await pool.query('SELECT * FROM ambientes WHERE id = ?', [req.params.id]);
  if (rows.length === 0) {
    return res.status(404).json({ message: 'Ambiente não encontrado.' });
  }
  res.json(rows[0]);
}

/**
 * POST /api/ambientes
 */
async function criar(req, res) {
  const { predio_id, bloco, andar, nome } = req.body;

  if (!predio_id || !nome) {
    return res.status(400).json({ message: 'Prédio e nome do ambiente são obrigatórios.' });
  }

  const [predio] = await pool.query('SELECT id FROM predios WHERE id = ?', [predio_id]);
  if (predio.length === 0) {
    return res.status(404).json({ message: 'Prédio informado não existe.' });
  }

  const [resultado] = await pool.query(
    'INSERT INTO ambientes (predio_id, bloco, andar, nome) VALUES (?, ?, ?, ?)',
    [predio_id, bloco || null, andar || null, nome]
  );

  const [rows] = await pool.query('SELECT * FROM ambientes WHERE id = ?', [resultado.insertId]);
  res.status(201).json(rows[0]);
}

/**
 * PUT /api/ambientes/:id
 */
async function atualizar(req, res) {
  const { id } = req.params;
  const { bloco, andar, nome } = req.body;

  const [existentes] = await pool.query('SELECT * FROM ambientes WHERE id = ?', [id]);
  if (existentes.length === 0) {
    return res.status(404).json({ message: 'Ambiente não encontrado.' });
  }

  const atual = existentes[0];
  await pool.query('UPDATE ambientes SET bloco = ?, andar = ?, nome = ? WHERE id = ?', [
    bloco ?? atual.bloco,
    andar ?? atual.andar,
    nome ?? atual.nome,
    id,
  ]);

  const [rows] = await pool.query('SELECT * FROM ambientes WHERE id = ?', [id]);
  res.json(rows[0]);
}

/**
 * DELETE /api/ambientes/:id
 */
async function remover(req, res) {
  const { id } = req.params;
  const [resultado] = await pool.query('DELETE FROM ambientes WHERE id = ?', [id]);
  if (resultado.affectedRows === 0) {
    return res.status(404).json({ message: 'Ambiente não encontrado.' });
  }
  res.json({ message: 'Ambiente removido com sucesso.' });
}

module.exports = { listar, obter, criar, atualizar, remover };
