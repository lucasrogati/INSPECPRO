const { pool } = require('../config/db');

/**
 * GET /api/predios
 * Lista prédios com estatísticas agregadas (usadas nos cards do dashboard/tela de Prédios).
 */
async function listar(req, res) {
  const { busca, tipo } = req.query;
  const condicoes = [];
  const valores = [];

  if (busca) {
    condicoes.push('(p.nome LIKE ? OR p.endereco LIKE ?)');
    valores.push(`%${busca}%`, `%${busca}%`);
  }
  if (tipo) {
    condicoes.push('p.tipo = ?');
    valores.push(tipo);
  }
  const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `
    SELECT
      p.id, p.nome, p.endereco, p.tipo, p.observacoes, p.created_at,
      COUNT(DISTINCT amb.id) AS total_ambientes,
      COUNT(DISTINCT i.id) AS total_inspecoes,
      COUNT(DISTINCT CASE WHEN a.status != 'resolvido' THEN a.id END) AS anomalias_pendentes,
      COUNT(DISTINCT CASE WHEN a.prioridade = 'critica' AND a.status != 'resolvido' THEN a.id END) AS anomalias_criticas,
      MAX(i.data_inspecao) AS ultima_inspecao
    FROM predios p
    LEFT JOIN ambientes amb ON amb.predio_id = p.id
    LEFT JOIN inspecoes i ON i.predio_id = p.id
    LEFT JOIN anomalias a ON a.inspecao_id = i.id
    ${where}
    GROUP BY p.id
    ORDER BY p.nome ASC
    `,
    valores
  );
  res.json(rows);
}

/**
 * GET /api/predios/:id
 * Retorna o prédio com seus ambientes (hierarquia Bloco -> Andar -> Ambiente).
 */
async function obter(req, res) {
  const { id } = req.params;

  const [predios] = await pool.query('SELECT * FROM predios WHERE id = ?', [id]);
  if (predios.length === 0) {
    return res.status(404).json({ message: 'Prédio não encontrado.' });
  }

  const [ambientes] = await pool.query(
    'SELECT * FROM ambientes WHERE predio_id = ? ORDER BY bloco, andar, nome',
    [id]
  );

  res.json({ ...predios[0], ambientes });
}

/**
 * POST /api/predios
 */
async function criar(req, res) {
  const { nome, endereco, tipo, observacoes } = req.body;

  if (!nome || !endereco || !tipo) {
    return res.status(400).json({ message: 'Nome, endereço e tipo são obrigatórios.' });
  }

  const [resultado] = await pool.query(
    'INSERT INTO predios (nome, endereco, tipo, observacoes) VALUES (?, ?, ?, ?)',
    [nome, endereco, tipo, observacoes || null]
  );

  const [rows] = await pool.query('SELECT * FROM predios WHERE id = ?', [resultado.insertId]);
  res.status(201).json(rows[0]);
}

/**
 * PUT /api/predios/:id
 */
async function atualizar(req, res) {
  const { id } = req.params;
  const { nome, endereco, tipo, observacoes } = req.body;

  const [existentes] = await pool.query('SELECT * FROM predios WHERE id = ?', [id]);
  if (existentes.length === 0) {
    return res.status(404).json({ message: 'Prédio não encontrado.' });
  }

  const atual = existentes[0];
  await pool.query('UPDATE predios SET nome = ?, endereco = ?, tipo = ?, observacoes = ? WHERE id = ?', [
    nome ?? atual.nome,
    endereco ?? atual.endereco,
    tipo ?? atual.tipo,
    observacoes ?? atual.observacoes,
    id,
  ]);

  const [rows] = await pool.query('SELECT * FROM predios WHERE id = ?', [id]);
  res.json(rows[0]);
}

/**
 * DELETE /api/predios/:id
 */
async function remover(req, res) {
  const { id } = req.params;
  const [resultado] = await pool.query('DELETE FROM predios WHERE id = ?', [id]);
  if (resultado.affectedRows === 0) {
    return res.status(404).json({ message: 'Prédio não encontrado.' });
  }
  res.json({ message: 'Prédio removido com sucesso.' });
}

module.exports = { listar, obter, criar, atualizar, remover };
