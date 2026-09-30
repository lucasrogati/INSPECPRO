const { pool } = require('../config/db');
const { rotuloPrioridade } = require('../utils/validators');
const { hoje } = require('../utils/datas');

const PERFIS_GESTAO = ['administrador', 'gestor', 'engenheiro'];
const LIMITE_POR_CATEGORIA = 30;
const LIMITE_EXIBIDO = 15;

const FROM_ANOMALIA = `
  FROM anomalias a
  JOIN inspecoes i ON i.id = a.inspecao_id
  JOIN predios pr ON pr.id = i.predio_id
  JOIN ambientes amb ON amb.id = a.ambiente_id`;

const COLUNAS_ANOMALIA = `a.id, a.titulo, a.prioridade, a.prazo, pr.nome AS predio_nome, amb.nome AS ambiente_nome`;

/**
 * GET /api/notificacoes
 * Gera os alertas do usuário a partir do estado atual dos dados (sem tabela própria):
 *  - anomalias vencidas e críticas em aberto;
 *  - anomalias aguardando verificação (perfis de gestão);
 *  - anomalias e manutenções atribuídas ao próprio usuário.
 * Perfis de gestão veem tudo; os demais veem apenas o que é de sua responsabilidade.
 */
async function listar(req, res) {
  const { id: usuarioId, tipo } = req.usuario;
  const gestao = PERFIS_GESTAO.includes(tipo);
  const escopo = gestao ? '' : 'AND a.responsavel_id = ?';
  const pEscopo = gestao ? [] : [usuarioId];

  const [[vencidas], [criticas], [verificacao], [atribuidas], [manutencoes]] = await Promise.all([
    pool.query(
      `SELECT ${COLUNAS_ANOMALIA} ${FROM_ANOMALIA}
       WHERE a.status <> 'resolvido' AND a.prazo IS NOT NULL AND a.prazo < CURDATE() ${escopo}
       ORDER BY a.prazo ASC LIMIT ${LIMITE_POR_CATEGORIA}`,
      pEscopo
    ),
    pool.query(
      `SELECT ${COLUNAS_ANOMALIA} ${FROM_ANOMALIA}
       WHERE a.status <> 'resolvido' AND a.prioridade = 'critica' ${escopo}
       ORDER BY a.created_at DESC LIMIT ${LIMITE_POR_CATEGORIA}`,
      pEscopo
    ),
    gestao
      ? pool.query(
          `SELECT ${COLUNAS_ANOMALIA} ${FROM_ANOMALIA}
           WHERE a.status = 'aguardando_verificacao'
           ORDER BY a.updated_at DESC LIMIT ${LIMITE_POR_CATEGORIA}`
        )
      : Promise.resolve([[]]),
    pool.query(
      `SELECT ${COLUNAS_ANOMALIA} ${FROM_ANOMALIA}
       WHERE a.status = 'pendente' AND a.responsavel_id = ?
       ORDER BY FIELD(a.prioridade, 'critica', 'alta', 'media', 'baixa'), a.created_at DESC
       LIMIT ${LIMITE_POR_CATEGORIA}`,
      [usuarioId]
    ),
    pool.query(
      `SELECT m.id, m.anomalia_id, m.status, m.data_inicio, a.titulo, pr.nome AS predio_nome
       FROM manutencoes m
       JOIN anomalias a ON a.id = m.anomalia_id
       JOIN inspecoes i ON i.id = a.inspecao_id
       JOIN predios pr ON pr.id = i.predio_id
       WHERE m.responsavel_id = ? AND m.status IN ('agendada', 'em_andamento')
       ORDER BY (m.data_inicio IS NULL), m.data_inicio ASC LIMIT ${LIMITE_POR_CATEGORIA}`,
      [usuarioId]
    ),
  ]);

  // Uma mesma anomalia gera no máximo um alerta (o mais grave, na ordem em que são inseridos).
  const jaNotificadas = new Set();
  const itens = [];
  const local = (r) => `${r.predio_nome} · ${r.ambiente_nome}`;

  function adicionarAnomalias(rows, tipoAlerta, severidade, titulo, descricao) {
    rows.forEach((r) => {
      if (jaNotificadas.has(r.id)) return;
      jaNotificadas.add(r.id);
      itens.push({
        id: `${tipoAlerta}-${r.id}`,
        tipo: tipoAlerta,
        severidade,
        titulo: titulo(r),
        descricao: descricao(r),
        link: `/anomalias/${r.id}`,
      });
    });
  }

  adicionarAnomalias(
    vencidas,
    'vencida',
    'alta',
    (r) => `Prazo vencido: ${r.titulo}`,
    (r) => `${local(r)} · venceu em ${r.prazo.slice(8, 10)}/${r.prazo.slice(5, 7)}/${r.prazo.slice(0, 4)}`
  );
  adicionarAnomalias(
    criticas,
    'critica',
    'alta',
    (r) => `Anomalia crítica em aberto: ${r.titulo}`,
    (r) => local(r)
  );
  adicionarAnomalias(
    verificacao,
    'verificacao',
    'media',
    (r) => `Aguardando verificação: ${r.titulo}`,
    (r) => local(r)
  );
  adicionarAnomalias(
    atribuidas,
    'atribuida',
    'info',
    (r) => `Atribuída a você: ${r.titulo}`,
    (r) => `${local(r)} · prioridade ${rotuloPrioridade(r.prioridade)}`
  );

  manutencoes.forEach((m) => {
    const atrasada = m.status === 'agendada' && m.data_inicio && m.data_inicio < hoje();
    itens.push({
      id: `manutencao-${m.id}`,
      tipo: 'manutencao',
      severidade: atrasada ? 'media' : 'info',
      titulo: `${m.status === 'em_andamento' ? 'Manutenção em andamento' : 'Manutenção agendada'}: ${m.titulo}`,
      descricao: m.predio_nome,
      link: `/anomalias/${m.anomalia_id}`,
    });
  });

  const ordemSeveridade = { alta: 0, media: 1, info: 2 };
  itens.sort((a, b) => ordemSeveridade[a.severidade] - ordemSeveridade[b.severidade]);

  res.json({ total: itens.length, itens: itens.slice(0, LIMITE_EXIBIDO) });
}

module.exports = { listar };
