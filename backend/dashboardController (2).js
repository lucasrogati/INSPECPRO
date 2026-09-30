const { pool } = require('../config/db');
const { STATUS_MANUTENCAO, isDataValida } = require('../utils/validators');
const { registrarHistorico, mudarStatusAnomalia } = require('../utils/historico');
const { comTransacao } = require('../utils/transaction');
const { hoje } = require('../utils/datas');

const ROTULO_STATUS = { agendada: 'agendada', em_andamento: 'iniciada', concluida: 'concluída' };

const SELECT_BASE = `
  SELECT
    m.id, m.anomalia_id, m.responsavel_id, m.descricao, m.data_inicio, m.data_conclusao, m.status,
    m.created_at, m.updated_at,
    a.titulo AS anomalia_titulo, a.prioridade AS anomalia_prioridade, a.status AS anomalia_status,
    i.predio_id, p.nome AS predio_nome, amb.nome AS ambiente_nome,
    u.nome AS responsavel_nome
  FROM manutencoes m
  JOIN anomalias a ON a.id = m.anomalia_id
  JOIN inspecoes i ON i.id = a.inspecao_id
  JOIN predios p ON p.id = i.predio_id
  JOIN ambientes amb ON amb.id = a.ambiente_id
  JOIN usuarios u ON u.id = m.responsavel_id
`;

function temCampo(body, campo) {
  return Object.prototype.hasOwnProperty.call(body, campo);
}

function vazioParaNull(valor) {
  return valor === '' || valor === undefined ? null : valor;
}

/**
 * Calcula status e datas coerentes para uma manutenção.
 *  - em_andamento: garante data_inicio (hoje, se vazia) e limpa data_conclusao
 *  - concluida:    garante data_inicio e data_conclusao (hoje, se vazias)
 *  - agendada:     limpa data_conclusao
 */
function aplicarStatus(status, { data_inicio, data_conclusao }) {
  if (status === 'em_andamento') {
    return { status, data_inicio: data_inicio || hoje(), data_conclusao: null };
  }
  if (status === 'concluida') {
    const inicio = data_inicio || hoje();
    return { status, data_inicio: inicio, data_conclusao: data_conclusao || hoje() };
  }
  return { status, data_inicio: data_inicio || null, data_conclusao: null };
}

/**
 * Mantém o status da anomalia coerente com suas manutenções.
 *  - Há manutenção agendada/em andamento          → anomalia "em_manutencao"
 *  - Última manutenção ativa foi concluída        → "aguardando_verificacao"
 *  - Manutenções ativas removidas/revertidas      → volta para "pendente"
 * Anomalias já resolvidas não são alteradas. Retorna true se o status mudou.
 */
async function sincronizarAnomalia(conn, { anomaliaId, usuarioId, concluiu = false, descricao }) {
  const [anomalias] = await conn.query('SELECT status FROM anomalias WHERE id = ?', [anomaliaId]);
  if (anomalias.length === 0 || anomalias[0].status === 'resolvido') return false;
  const statusAtual = anomalias[0].status;

  const [[contagem]] = await conn.query(
    `SELECT
       COALESCE(SUM(status IN ('agendada', 'em_andamento')), 0) AS ativas,
       COALESCE(SUM(status = 'concluida'), 0) AS concluidas
     FROM manutencoes WHERE anomalia_id = ?`,
    [anomaliaId]
  );
  const ativas = Number(contagem.ativas);
  const concluidas = Number(contagem.concluidas);

  let alvo = null;
  if (ativas > 0) {
    if (statusAtual !== 'em_manutencao') alvo = 'em_manutencao';
  } else if (concluiu) {
    if (statusAtual !== 'aguardando_verificacao') alvo = 'aguardando_verificacao';
  } else if (statusAtual === 'em_manutencao') {
    alvo = 'pendente';
  } else if (statusAtual === 'aguardando_verificacao' && concluidas === 0) {
    alvo = 'pendente';
  }

  if (!alvo) return false;
  return mudarStatusAnomalia(conn, { anomaliaId, usuarioId, novoStatus: alvo, descricao });
}

/** Registra o evento da manutenção no histórico da anomalia (junto da mudança de status, se houver). */
async function registrarEvento(conn, { anomaliaId, usuarioId, descricao, concluiu = false }) {
  const mudou = await sincronizarAnomalia(conn, { anomaliaId, usuarioId, concluiu, descricao });
  if (!mudou) {
    const [rows] = await conn.query('SELECT status FROM anomalias WHERE id = ?', [anomaliaId]);
    if (rows.length === 0) return;
    await registrarHistorico(conn, {
      anomaliaId,
      usuarioId,
      descricao,
      statusAnterior: rows[0].status,
      statusNovo: rows[0].status,
    });
  }
}

function validarDatas(inicio, conclusao) {
  if (inicio && !isDataValida(String(inicio).slice(0, 10))) return 'Data de início inválida. Use AAAA-MM-DD.';
  if (conclusao && !isDataValida(String(conclusao).slice(0, 10))) return 'Data de conclusão inválida. Use AAAA-MM-DD.';
  if (inicio && conclusao && String(conclusao).slice(0, 10) < String(inicio).slice(0, 10)) {
    return 'A data de conclusão não pode ser anterior à data de início.';
  }
  return null;
}

/**
 * GET /api/manutencoes
 * Filtros: anomalia_id, predio_id, responsavel_id, status, data_inicio, data_fim (sobre data_inicio),
 *          minhas=true (apenas do usuário autenticado).
 */
async function listar(req, res) {
  const { anomalia_id, predio_id, responsavel_id, status, data_inicio, data_fim, minhas } = req.query;
  const condicoes = [];
  const valores = [];

  if (anomalia_id) { condicoes.push('m.anomalia_id = ?'); valores.push(anomalia_id); }
  if (predio_id) { condicoes.push('i.predio_id = ?'); valores.push(predio_id); }
  if (responsavel_id) { condicoes.push('m.responsavel_id = ?'); valores.push(responsavel_id); }
  if (minhas === 'true') { condicoes.push('m.responsavel_id = ?'); valores.push(req.usuario.id); }
  if (status) { condicoes.push('m.status = ?'); valores.push(status); }
  if (data_inicio) { condicoes.push('m.data_inicio >= ?'); valores.push(data_inicio); }
  if (data_fim) { condicoes.push('m.data_inicio <= ?'); valores.push(data_fim); }

  const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `${SELECT_BASE} ${where}
     ORDER BY FIELD(m.status, 'em_andamento', 'agendada', 'concluida'), m.data_inicio IS NULL, m.data_inicio DESC, m.id DESC`,
    valores
  );
  res.json(rows);
}

/**
 * GET /api/manutencoes/:id
 */
async function obter(req, res) {
  const [rows] = await pool.query(`${SELECT_BASE} WHERE m.id = ?`, [req.params.id]);
  if (rows.length === 0) {
    return res.status(404).json({ message: 'Manutenção não encontrada.' });
  }
  res.json(rows[0]);
}

/**
 * POST /api/manutencoes
 * Body: { anomalia_id, responsavel_id?, descricao?, data_inicio?, data_conclusao?, status? }
 */
async function criar(req, res) {
  const { anomalia_id, descricao } = req.body;
  const status = req.body.status || 'agendada';

  if (!anomalia_id) {
    return res.status(400).json({ message: 'A anomalia é obrigatória.' });
  }
  if (!STATUS_MANUTENCAO.includes(status)) {
    return res.status(400).json({ message: `Status inválido. Use um de: ${STATUS_MANUTENCAO.join(', ')}.` });
  }

  const [anomalias] = await pool.query('SELECT id, status, responsavel_id, titulo FROM anomalias WHERE id = ?', [anomalia_id]);
  if (anomalias.length === 0) {
    return res.status(404).json({ message: 'Anomalia informada não existe.' });
  }
  if (anomalias[0].status === 'resolvido') {
    return res.status(400).json({ message: 'Esta anomalia já foi resolvida. Reabra-a antes de agendar nova manutenção.' });
  }

  // Sem responsável informado, usa o responsável da anomalia.
  const responsavelId = vazioParaNull(req.body.responsavel_id) || anomalias[0].responsavel_id;
  if (!responsavelId) {
    return res.status(400).json({ message: 'Informe o responsável pela manutenção.' });
  }
  const [resp] = await pool.query('SELECT id, nome FROM usuarios WHERE id = ? AND ativo = 1', [responsavelId]);
  if (resp.length === 0) {
    return res.status(404).json({ message: 'Responsável informado não existe ou está inativo.' });
  }

  const inicio = vazioParaNull(req.body.data_inicio);
  const conclusao = vazioParaNull(req.body.data_conclusao);
  const erroData = validarDatas(inicio, conclusao);
  if (erroData) return res.status(400).json({ message: erroData });

  const dados = aplicarStatus(status, { data_inicio: inicio, data_conclusao: conclusao });

  const novoId = await comTransacao(async (conn) => {
    const [resultado] = await conn.query(
      'INSERT INTO manutencoes (anomalia_id, responsavel_id, descricao, data_inicio, data_conclusao, status) VALUES (?, ?, ?, ?, ?, ?)',
      [anomalia_id, responsavelId, vazioParaNull(descricao), dados.data_inicio, dados.data_conclusao, dados.status]
    );
    await registrarEvento(conn, {
      anomaliaId: anomalia_id,
      usuarioId: req.usuario.id,
      descricao: `Manutenção #${resultado.insertId} ${ROTULO_STATUS[dados.status]} (responsável: ${resp[0].nome}).`,
      concluiu: dados.status === 'concluida',
    });
    return resultado.insertId;
  });

  const [rows] = await pool.query(`${SELECT_BASE} WHERE m.id = ?`, [novoId]);
  res.status(201).json(rows[0]);
}

/**
 * PUT /api/manutencoes/:id
 */
async function atualizar(req, res) {
  const { id } = req.params;
  const body = req.body;

  const [existentes] = await pool.query('SELECT * FROM manutencoes WHERE id = ?', [id]);
  if (existentes.length === 0) {
    return res.status(404).json({ message: 'Manutenção não encontrada.' });
  }
  const atual = existentes[0];

  const status = temCampo(body, 'status') ? body.status : atual.status;
  if (!STATUS_MANUTENCAO.includes(status)) {
    return res.status(400).json({ message: `Status inválido. Use um de: ${STATUS_MANUTENCAO.join(', ')}.` });
  }

  const responsavelId = temCampo(body, 'responsavel_id') ? vazioParaNull(body.responsavel_id) : atual.responsavel_id;
  if (!responsavelId) {
    return res.status(400).json({ message: 'O responsável pela manutenção é obrigatório.' });
  }
  const [resp] = await pool.query('SELECT id, nome FROM usuarios WHERE id = ? AND ativo = 1', [responsavelId]);
  if (resp.length === 0) {
    return res.status(404).json({ message: 'Responsável informado não existe ou está inativo.' });
  }

  const inicio = temCampo(body, 'data_inicio') ? vazioParaNull(body.data_inicio) : atual.data_inicio;
  const conclusao = temCampo(body, 'data_conclusao') ? vazioParaNull(body.data_conclusao) : atual.data_conclusao;
  const erroData = validarDatas(inicio, conclusao);
  if (erroData) return res.status(400).json({ message: erroData });

  const descricao = temCampo(body, 'descricao') ? vazioParaNull(body.descricao) : atual.descricao;
  const dados = aplicarStatus(status, { data_inicio: inicio, data_conclusao: conclusao });

  await comTransacao(async (conn) => {
    await conn.query(
      'UPDATE manutencoes SET responsavel_id = ?, descricao = ?, data_inicio = ?, data_conclusao = ?, status = ? WHERE id = ?',
      [responsavelId, descricao, dados.data_inicio, dados.data_conclusao, dados.status, id]
    );

    if (dados.status !== atual.status) {
      await registrarEvento(conn, {
        anomaliaId: atual.anomalia_id,
        usuarioId: req.usuario.id,
        descricao: `Manutenção #${id} ${ROTULO_STATUS[dados.status]}.`,
        concluiu: dados.status === 'concluida',
      });
    }
  });

  const [rows] = await pool.query(`${SELECT_BASE} WHERE m.id = ?`, [id]);
  res.json(rows[0]);
}

/**
 * PATCH /api/manutencoes/:id/status
 * Body: { status, observacao? }
 * Administrador/gestor/engenheiro alteram qualquer manutenção;
 * o perfil "manutencao" só altera as que são de sua responsabilidade.
 */
async function alterarStatus(req, res) {
  const { id } = req.params;
  const { status, observacao } = req.body;

  if (!status || !STATUS_MANUTENCAO.includes(status)) {
    return res.status(400).json({ message: `Status inválido. Use um de: ${STATUS_MANUTENCAO.join(', ')}.` });
  }

  const [existentes] = await pool.query('SELECT * FROM manutencoes WHERE id = ?', [id]);
  if (existentes.length === 0) {
    return res.status(404).json({ message: 'Manutenção não encontrada.' });
  }
  const atual = existentes[0];

  if (req.usuario.tipo === 'manutencao' && atual.responsavel_id !== req.usuario.id) {
    return res.status(403).json({ message: 'Você só pode atualizar manutenções sob sua responsabilidade.' });
  }
  if (atual.status === status) {
    return res.status(400).json({ message: 'A manutenção já está com este status.' });
  }

  const dados = aplicarStatus(status, { data_inicio: atual.data_inicio, data_conclusao: atual.data_conclusao });

  await comTransacao(async (conn) => {
    await conn.query('UPDATE manutencoes SET status = ?, data_inicio = ?, data_conclusao = ? WHERE id = ?', [
      dados.status,
      dados.data_inicio,
      dados.data_conclusao,
      id,
    ]);
    await registrarEvento(conn, {
      anomaliaId: atual.anomalia_id,
      usuarioId: req.usuario.id,
      descricao: `Manutenção #${id} ${ROTULO_STATUS[dados.status]}.${observacao ? ` ${String(observacao).trim()}` : ''}`,
      concluiu: dados.status === 'concluida',
    });
  });

  const [rows] = await pool.query(`${SELECT_BASE} WHERE m.id = ?`, [id]);
  res.json(rows[0]);
}

/**
 * DELETE /api/manutencoes/:id
 */
async function remover(req, res) {
  const { id } = req.params;

  const [existentes] = await pool.query('SELECT anomalia_id FROM manutencoes WHERE id = ?', [id]);
  if (existentes.length === 0) {
    return res.status(404).json({ message: 'Manutenção não encontrada.' });
  }

  await comTransacao(async (conn) => {
    await conn.query('DELETE FROM manutencoes WHERE id = ?', [id]);
    await registrarEvento(conn, {
      anomaliaId: existentes[0].anomalia_id,
      usuarioId: req.usuario.id,
      descricao: `Manutenção #${id} removida.`,
    });
  });

  res.json({ message: 'Manutenção removida com sucesso.' });
}

module.exports = { listar, obter, criar, atualizar, alterarStatus, remover };
