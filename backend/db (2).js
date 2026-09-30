const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');
const { PRIORIDADES, STATUS_ANOMALIA, isDataValida } = require('../utils/validators');
const { registrarHistorico, mudarStatusAnomalia } = require('../utils/historico');
const { comTransacao } = require('../utils/transaction');

const ROTULO_PRIORIDADE = { baixa: 'Baixa', media: 'Média', alta: 'Alta', critica: 'Crítica' };
const PASTA_UPLOADS = path.resolve('uploads');

// JOINs trazem prédio, ambiente e responsável para evitar requisições extras no frontend.
const SELECT_BASE = `
  SELECT
    a.id, a.inspecao_id, a.ambiente_id, a.titulo, a.descricao, a.categoria,
    a.prioridade, a.status, a.responsavel_id, a.prazo, a.created_at, a.updated_at,
    (a.prazo IS NOT NULL AND a.prazo < CURDATE() AND a.status <> 'resolvido') AS vencida,
    i.predio_id, i.data_inspecao,
    p.nome AS predio_nome,
    amb.nome AS ambiente_nome, amb.bloco AS ambiente_bloco, amb.andar AS ambiente_andar,
    u.nome AS responsavel_nome,
    (SELECT COUNT(*) FROM fotos_anomalia f WHERE f.anomalia_id = a.id) AS total_fotos
  FROM anomalias a
  JOIN inspecoes i ON i.id = a.inspecao_id
  JOIN predios p ON p.id = i.predio_id
  JOIN ambientes amb ON amb.id = a.ambiente_id
  LEFT JOIN usuarios u ON u.id = a.responsavel_id
`;

function formatar(row) {
  return { ...row, vencida: Boolean(row.vencida), total_fotos: Number(row.total_fotos) };
}

function apagarArquivo(imagem) {
  try {
    const caminho = path.resolve(PASTA_UPLOADS, String(imagem).replace(/^\/?uploads\//, ''));
    // Evita path traversal: só apaga arquivos dentro da pasta de uploads.
    if (caminho.startsWith(PASTA_UPLOADS + path.sep)) fs.unlinkSync(caminho);
  } catch {
    // Arquivo já removido ou inexistente — não é um erro para o fluxo.
  }
}

function temCampo(body, campo) {
  return Object.prototype.hasOwnProperty.call(body, campo);
}

function vazioParaNull(valor) {
  return valor === '' || valor === undefined ? null : valor;
}

/**
 * GET /api/anomalias
 * Filtros: inspecao_id, predio_id, ambiente_id, status, prioridade, responsavel_id,
 *          busca, abertas=true, vencidas=true.
 */
async function listar(req, res) {
  const { inspecao_id, predio_id, ambiente_id, status, prioridade, responsavel_id, busca, abertas, vencidas } = req.query;
  const condicoes = [];
  const valores = [];

  if (inspecao_id) { condicoes.push('a.inspecao_id = ?'); valores.push(inspecao_id); }
  if (predio_id) { condicoes.push('i.predio_id = ?'); valores.push(predio_id); }
  if (ambiente_id) { condicoes.push('a.ambiente_id = ?'); valores.push(ambiente_id); }
  if (status) { condicoes.push('a.status = ?'); valores.push(status); }
  if (prioridade) { condicoes.push('a.prioridade = ?'); valores.push(prioridade); }
  if (responsavel_id) { condicoes.push('a.responsavel_id = ?'); valores.push(responsavel_id); }
  if (busca) {
    condicoes.push('(a.titulo LIKE ? OR a.descricao LIKE ? OR a.categoria LIKE ? OR amb.nome LIKE ?)');
    valores.push(`%${busca}%`, `%${busca}%`, `%${busca}%`, `%${busca}%`);
  }
  if (abertas === 'true') condicoes.push("a.status <> 'resolvido'");
  if (vencidas === 'true') condicoes.push("a.prazo IS NOT NULL AND a.prazo < CURDATE() AND a.status <> 'resolvido'");

  const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';

  // Abertas primeiro, das mais críticas às mais leves; dentro da prioridade, prazo mais próximo primeiro.
  const [rows] = await pool.query(
    `${SELECT_BASE} ${where}
     ORDER BY (a.status = 'resolvido'),
              FIELD(a.prioridade, 'critica', 'alta', 'media', 'baixa'),
              (a.prazo IS NULL), a.prazo ASC, a.id DESC`,
    valores
  );
  res.json(rows.map(formatar));
}

/**
 * GET /api/anomalias/responsaveis
 * Lista enxuta de usuários ativos para o campo "responsável" (o CRUD de usuários é só do administrador).
 */
async function listarResponsaveis(req, res) {
  const [rows] = await pool.query('SELECT id, nome, tipo FROM usuarios WHERE ativo = 1 ORDER BY nome ASC');
  res.json(rows);
}

/**
 * GET /api/anomalias/:id
 * Retorna a anomalia com fotos, histórico e manutenções vinculadas.
 */
async function obter(req, res) {
  const { id } = req.params;
  const [rows] = await pool.query(`${SELECT_BASE} WHERE a.id = ?`, [id]);
  if (rows.length === 0) {
    return res.status(404).json({ message: 'Anomalia não encontrada.' });
  }

  const [fotos] = await pool.query(
    'SELECT id, anomalia_id, imagem, data FROM fotos_anomalia WHERE anomalia_id = ? ORDER BY id ASC',
    [id]
  );
  const [historico] = await pool.query(
    `SELECT h.id, h.descricao, h.status_anterior, h.status_novo, h.data, h.usuario_id, u.nome AS usuario_nome
     FROM historico_anomalia h
     JOIN usuarios u ON u.id = h.usuario_id
     WHERE h.anomalia_id = ?
     ORDER BY h.data DESC, h.id DESC`,
    [id]
  );
  const [manutencoes] = await pool.query(
    `SELECT m.id, m.anomalia_id, m.responsavel_id, m.descricao, m.data_inicio, m.data_conclusao, m.status,
            m.created_at, u.nome AS responsavel_nome
     FROM manutencoes m
     JOIN usuarios u ON u.id = m.responsavel_id
     WHERE m.anomalia_id = ?
     ORDER BY m.id DESC`,
    [id]
  );

  res.json({ ...formatar(rows[0]), fotos, historico, manutencoes });
}

/**
 * POST /api/anomalias
 */
async function criar(req, res) {
  const { inspecao_id, ambiente_id, titulo, descricao, categoria, prioridade } = req.body;
  const responsavel_id = vazioParaNull(req.body.responsavel_id);
  const prazo = vazioParaNull(req.body.prazo);

  if (!inspecao_id || !ambiente_id || !titulo || !String(titulo).trim()) {
    return res.status(400).json({ message: 'Inspeção, ambiente e título são obrigatórios.' });
  }
  if (prioridade && !PRIORIDADES.includes(prioridade)) {
    return res.status(400).json({ message: `Prioridade inválida. Use uma de: ${PRIORIDADES.join(', ')}.` });
  }
  if (prazo && !isDataValida(prazo)) {
    return res.status(400).json({ message: 'Prazo inválido. Use o formato AAAA-MM-DD.' });
  }

  const [inspecao] = await pool.query('SELECT id, predio_id FROM inspecoes WHERE id = ?', [inspecao_id]);
  if (inspecao.length === 0) {
    return res.status(404).json({ message: 'Inspeção informada não existe.' });
  }

  const [ambiente] = await pool.query('SELECT id, predio_id FROM ambientes WHERE id = ?', [ambiente_id]);
  if (ambiente.length === 0) {
    return res.status(404).json({ message: 'Ambiente informado não existe.' });
  }
  if (ambiente[0].predio_id !== inspecao[0].predio_id) {
    return res.status(400).json({ message: 'O ambiente não pertence ao prédio desta inspeção.' });
  }

  if (responsavel_id) {
    const [resp] = await pool.query('SELECT id FROM usuarios WHERE id = ? AND ativo = 1', [responsavel_id]);
    if (resp.length === 0) {
      return res.status(404).json({ message: 'Responsável informado não existe ou está inativo.' });
    }
  }

  // Com responsável definido, a anomalia já nasce "pendente" (aguardando manutenção).
  const statusInicial = responsavel_id ? 'pendente' : 'identificado';

  const novoId = await comTransacao(async (conn) => {
    const [resultado] = await conn.query(
      `INSERT INTO anomalias
         (inspecao_id, ambiente_id, titulo, descricao, categoria, prioridade, status, responsavel_id, prazo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        inspecao_id,
        ambiente_id,
        String(titulo).trim(),
        vazioParaNull(descricao),
        vazioParaNull(categoria),
        prioridade || 'media',
        statusInicial,
        responsavel_id,
        prazo,
      ]
    );
    await registrarHistorico(conn, {
      anomaliaId: resultado.insertId,
      usuarioId: req.usuario.id,
      descricao: 'Anomalia registrada.',
      statusAnterior: null,
      statusNovo: statusInicial,
    });
    return resultado.insertId;
  });

  const [rows] = await pool.query(`${SELECT_BASE} WHERE a.id = ?`, [novoId]);
  res.status(201).json(formatar(rows[0]));
}

/**
 * PUT /api/anomalias/:id
 * Atualiza os dados. Alterações de prioridade, responsável e prazo entram no histórico.
 * O status NÃO é alterado aqui (use PATCH /:id/status, manutenções ou /:id/verificar).
 */
async function atualizar(req, res) {
  const { id } = req.params;
  const body = req.body;

  const [existentes] = await pool.query(
    `SELECT a.*, i.predio_id FROM anomalias a JOIN inspecoes i ON i.id = a.inspecao_id WHERE a.id = ?`,
    [id]
  );
  if (existentes.length === 0) {
    return res.status(404).json({ message: 'Anomalia não encontrada.' });
  }
  const atual = existentes[0];

  const titulo = temCampo(body, 'titulo') ? String(body.titulo || '').trim() : atual.titulo;
  if (!titulo) {
    return res.status(400).json({ message: 'O título não pode ficar vazio.' });
  }

  const prioridade = temCampo(body, 'prioridade') ? body.prioridade : atual.prioridade;
  if (!PRIORIDADES.includes(prioridade)) {
    return res.status(400).json({ message: `Prioridade inválida. Use uma de: ${PRIORIDADES.join(', ')}.` });
  }

  const prazo = temCampo(body, 'prazo') ? vazioParaNull(body.prazo) : atual.prazo;
  if (prazo && !isDataValida(String(prazo).slice(0, 10))) {
    return res.status(400).json({ message: 'Prazo inválido. Use o formato AAAA-MM-DD.' });
  }

  const ambienteId = temCampo(body, 'ambiente_id') ? body.ambiente_id : atual.ambiente_id;
  if (Number(ambienteId) !== Number(atual.ambiente_id)) {
    const [amb] = await pool.query('SELECT id, predio_id FROM ambientes WHERE id = ?', [ambienteId]);
    if (amb.length === 0) {
      return res.status(404).json({ message: 'Ambiente informado não existe.' });
    }
    if (amb[0].predio_id !== atual.predio_id) {
      return res.status(400).json({ message: 'O ambiente não pertence ao prédio desta inspeção.' });
    }
  }

  const responsavelId = temCampo(body, 'responsavel_id') ? vazioParaNull(body.responsavel_id) : atual.responsavel_id;
  let nomeResponsavel = null;
  if (responsavelId) {
    const [resp] = await pool.query('SELECT id, nome FROM usuarios WHERE id = ? AND ativo = 1', [responsavelId]);
    if (resp.length === 0) {
      return res.status(404).json({ message: 'Responsável informado não existe ou está inativo.' });
    }
    nomeResponsavel = resp[0].nome;
  }

  const descricao = temCampo(body, 'descricao') ? vazioParaNull(body.descricao) : atual.descricao;
  const categoria = temCampo(body, 'categoria') ? vazioParaNull(body.categoria) : atual.categoria;

  // Monta a descrição das mudanças relevantes para o histórico.
  const mudancas = [];
  if (prioridade !== atual.prioridade) {
    mudancas.push(`Prioridade alterada de ${ROTULO_PRIORIDADE[atual.prioridade]} para ${ROTULO_PRIORIDADE[prioridade]}.`);
  }
  if ((responsavelId || null) !== (atual.responsavel_id || null)) {
    mudancas.push(nomeResponsavel ? `Responsável definido: ${nomeResponsavel}.` : 'Responsável removido.');
  }
  const prazoAtual = atual.prazo ? String(atual.prazo).slice(0, 10) : null;
  const prazoNovo = prazo ? String(prazo).slice(0, 10) : null;
  if (prazoNovo !== prazoAtual) {
    const fmt = (d) => d.split('-').reverse().join('/');
    mudancas.push(prazoNovo ? `Prazo definido para ${fmt(prazoNovo)}.` : 'Prazo removido.');
  }

  await comTransacao(async (conn) => {
    await conn.query(
      `UPDATE anomalias
       SET ambiente_id = ?, titulo = ?, descricao = ?, categoria = ?, prioridade = ?, responsavel_id = ?, prazo = ?
       WHERE id = ?`,
      [ambienteId, titulo, descricao, categoria, prioridade, responsavelId, prazoNovo, id]
    );

    if (mudancas.length > 0) {
      await registrarHistorico(conn, {
        anomaliaId: id,
        usuarioId: req.usuario.id,
        descricao: mudancas.join(' '),
        statusAnterior: atual.status,
        statusNovo: atual.status,
      });
    }

    // Ao atribuir o primeiro responsável a uma anomalia recém-identificada, ela passa a "pendente".
    if (atual.status === 'identificado' && responsavelId && !atual.responsavel_id) {
      await mudarStatusAnomalia(conn, {
        anomaliaId: id,
        usuarioId: req.usuario.id,
        novoStatus: 'pendente',
        descricao: 'Responsável atribuído; anomalia aguardando manutenção.',
      });
    }
  });

  const [rows] = await pool.query(`${SELECT_BASE} WHERE a.id = ?`, [id]);
  res.json(formatar(rows[0]));
}

/**
 * PATCH /api/anomalias/:id/status
 * Ajuste manual de status. "resolvido" só é alcançado pela verificação (POST /:id/verificar).
 * Body: { status, observacao? }
 */
async function alterarStatus(req, res) {
  const { id } = req.params;
  const { status, observacao } = req.body;

  if (!status || !STATUS_ANOMALIA.includes(status)) {
    return res.status(400).json({ message: `Status inválido. Use um de: ${STATUS_ANOMALIA.join(', ')}.` });
  }
  if (status === 'resolvido') {
    return res.status(400).json({ message: 'Para resolver uma anomalia, use a verificação (aprovar).' });
  }

  const [existentes] = await pool.query('SELECT id, status FROM anomalias WHERE id = ?', [id]);
  if (existentes.length === 0) {
    return res.status(404).json({ message: 'Anomalia não encontrada.' });
  }
  if (existentes[0].status === status) {
    return res.status(400).json({ message: 'A anomalia já está com este status.' });
  }

  const reabrindo = existentes[0].status === 'resolvido';
  await mudarStatusAnomalia(pool, {
    anomaliaId: id,
    usuarioId: req.usuario.id,
    novoStatus: status,
    descricao: observacao || (reabrindo ? 'Anomalia reaberta.' : 'Status alterado manualmente.'),
  });

  const [rows] = await pool.query(`${SELECT_BASE} WHERE a.id = ?`, [id]);
  res.json(formatar(rows[0]));
}

/**
 * POST /api/anomalias/:id/verificar
 * Etapa "Verificação → Resolvido". Só vale para anomalias aguardando verificação.
 * Body: { aprovada: boolean, observacao? }  (observação obrigatória ao reprovar)
 */
async function verificar(req, res) {
  const { id } = req.params;
  const { aprovada, observacao } = req.body;

  if (typeof aprovada !== 'boolean') {
    return res.status(400).json({ message: 'Informe "aprovada" como true ou false.' });
  }
  if (!aprovada && !(observacao && String(observacao).trim())) {
    return res.status(400).json({ message: 'Informe o motivo da reprovação.' });
  }

  const [existentes] = await pool.query('SELECT id, status FROM anomalias WHERE id = ?', [id]);
  if (existentes.length === 0) {
    return res.status(404).json({ message: 'Anomalia não encontrada.' });
  }
  if (existentes[0].status !== 'aguardando_verificacao') {
    return res.status(400).json({ message: 'Só é possível verificar anomalias que estão aguardando verificação.' });
  }

  await mudarStatusAnomalia(pool, {
    anomaliaId: id,
    usuarioId: req.usuario.id,
    novoStatus: aprovada ? 'resolvido' : 'pendente',
    descricao: aprovada
      ? `Verificação aprovada.${observacao ? ` ${String(observacao).trim()}` : ''}`
      : `Verificação reprovada: ${String(observacao).trim()}`,
  });

  const [rows] = await pool.query(`${SELECT_BASE} WHERE a.id = ?`, [id]);
  res.json(formatar(rows[0]));
}

/**
 * DELETE /api/anomalias/:id
 */
async function remover(req, res) {
  const { id } = req.params;

  const [fotos] = await pool.query('SELECT imagem FROM fotos_anomalia WHERE anomalia_id = ?', [id]);
  const [resultado] = await pool.query('DELETE FROM anomalias WHERE id = ?', [id]);
  if (resultado.affectedRows === 0) {
    return res.status(404).json({ message: 'Anomalia não encontrada.' });
  }

  fotos.forEach((f) => apagarArquivo(f.imagem));
  res.json({ message: 'Anomalia removida com sucesso.' });
}

/**
 * POST /api/anomalias/:id/fotos   (multipart/form-data, campo "fotos")
 */
async function adicionarFotos(req, res) {
  const { id } = req.params;
  const arquivos = req.files || [];

  const [existentes] = await pool.query('SELECT id FROM anomalias WHERE id = ?', [id]);
  if (existentes.length === 0) {
    arquivos.forEach((f) => apagarArquivo(`/uploads/anomalias/${f.filename}`));
    return res.status(404).json({ message: 'Anomalia não encontrada.' });
  }
  if (arquivos.length === 0) {
    return res.status(400).json({ message: 'Nenhuma foto enviada.' });
  }

  await comTransacao(async (conn) => {
    for (const arquivo of arquivos) {
      await conn.query('INSERT INTO fotos_anomalia (anomalia_id, imagem) VALUES (?, ?)', [
        id,
        `/uploads/anomalias/${arquivo.filename}`,
      ]);
    }
    const [rows] = await conn.query('SELECT status FROM anomalias WHERE id = ?', [id]);
    await registrarHistorico(conn, {
      anomaliaId: id,
      usuarioId: req.usuario.id,
      descricao: `${arquivos.length} foto(s) anexada(s).`,
      statusAnterior: rows[0].status,
      statusNovo: rows[0].status,
    });
  });

  const [fotos] = await pool.query(
    'SELECT id, anomalia_id, imagem, data FROM fotos_anomalia WHERE anomalia_id = ? ORDER BY id ASC',
    [id]
  );
  res.status(201).json(fotos);
}

/**
 * DELETE /api/anomalias/:id/fotos/:fotoId
 */
async function removerFoto(req, res) {
  const { id, fotoId } = req.params;

  const [fotos] = await pool.query('SELECT id, imagem FROM fotos_anomalia WHERE id = ? AND anomalia_id = ?', [fotoId, id]);
  if (fotos.length === 0) {
    return res.status(404).json({ message: 'Foto não encontrada.' });
  }

  await pool.query('DELETE FROM fotos_anomalia WHERE id = ?', [fotoId]);
  apagarArquivo(fotos[0].imagem);
  res.json({ message: 'Foto removida com sucesso.' });
}

module.exports = {
  listar,
  listarResponsaveis,
  obter,
  criar,
  atualizar,
  alterarStatus,
  verificar,
  remover,
  adicionarFotos,
  removerFoto,
};
