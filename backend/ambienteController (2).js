const { pool } = require('../config/db');
const { gerarCsv } = require('../utils/csv');
const { hoje } = require('../utils/datas');

const ROTULO_PRIORIDADE = { baixa: 'Baixa', media: 'Média', alta: 'Alta', critica: 'Crítica' };
const ROTULO_STATUS_ANOMALIA = {
  identificado: 'Identificado',
  pendente: 'Pendente',
  em_manutencao: 'Em manutenção',
  aguardando_verificacao: 'Aguardando verificação',
  resolvido: 'Resolvido',
};
const ROTULO_STATUS_MANUTENCAO = { agendada: 'Agendada', em_andamento: 'Em andamento', concluida: 'Concluída' };

function fmtData(valor) {
  if (!valor) return '';
  const [ano, mes, dia] = String(valor).slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
}

function contar(itens, campo) {
  return itens.reduce((acc, item) => {
    acc[item[campo]] = (acc[item[campo]] || 0) + 1;
    return acc;
  }, {});
}

function enviarCsv(res, nomeBase, colunas, linhas) {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${nomeBase}-${hoje()}.csv"`);
  res.send(gerarCsv(colunas, linhas));
}

/**
 * GET /api/relatorios/anomalias
 * Filtros: predio_id, status, prioridade, responsavel_id, data_inicio, data_fim (sobre a data de registro),
 *          vencidas=true. Com formato=csv devolve o arquivo para download.
 */
async function anomalias(req, res) {
  const { predio_id, status, prioridade, responsavel_id, data_inicio, data_fim, vencidas, formato } = req.query;
  const condicoes = [];
  const valores = [];

  if (predio_id) { condicoes.push('i.predio_id = ?'); valores.push(predio_id); }
  if (status) { condicoes.push('a.status = ?'); valores.push(status); }
  if (prioridade) { condicoes.push('a.prioridade = ?'); valores.push(prioridade); }
  if (responsavel_id) { condicoes.push('a.responsavel_id = ?'); valores.push(responsavel_id); }
  if (data_inicio) { condicoes.push('DATE(a.created_at) >= ?'); valores.push(data_inicio); }
  if (data_fim) { condicoes.push('DATE(a.created_at) <= ?'); valores.push(data_fim); }
  if (vencidas === 'true') condicoes.push("a.prazo IS NOT NULL AND a.prazo < CURDATE() AND a.status <> 'resolvido'");

  const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `SELECT
       a.id, a.titulo, a.categoria, a.prioridade, a.status, a.prazo, a.created_at,
       (a.prazo IS NOT NULL AND a.prazo < CURDATE() AND a.status <> 'resolvido') AS vencida,
       a.inspecao_id, i.data_inspecao,
       p.nome AS predio_nome,
       amb.bloco AS ambiente_bloco, amb.andar AS ambiente_andar, amb.nome AS ambiente_nome,
       u.nome AS responsavel_nome,
       (SELECT COUNT(*) FROM manutencoes m WHERE m.anomalia_id = a.id) AS total_manutencoes,
       (SELECT MAX(h.data) FROM historico_anomalia h WHERE h.anomalia_id = a.id AND h.status_novo = 'resolvido') AS resolvida_em
     FROM anomalias a
     JOIN inspecoes i ON i.id = a.inspecao_id
     JOIN predios p ON p.id = i.predio_id
     JOIN ambientes amb ON amb.id = a.ambiente_id
     LEFT JOIN usuarios u ON u.id = a.responsavel_id
     ${where}
     ORDER BY p.nome ASC, FIELD(a.prioridade, 'critica', 'alta', 'media', 'baixa'), a.id ASC`,
    valores
  );

  const itens = rows.map((r) => ({
    ...r,
    vencida: Boolean(r.vencida),
    total_manutencoes: Number(r.total_manutencoes),
    resolvida_em: r.status === 'resolvido' ? r.resolvida_em : null,
  }));

  if (formato === 'csv') {
    return enviarCsv(res, 'relatorio-anomalias', [
      { titulo: 'ID', valor: (l) => l.id },
      { titulo: 'Prédio', valor: (l) => l.predio_nome },
      { titulo: 'Bloco', valor: (l) => l.ambiente_bloco },
      { titulo: 'Andar', valor: (l) => l.ambiente_andar },
      { titulo: 'Ambiente', valor: (l) => l.ambiente_nome },
      { titulo: 'Anomalia', valor: (l) => l.titulo },
      { titulo: 'Categoria', valor: (l) => l.categoria },
      { titulo: 'Prioridade', valor: (l) => ROTULO_PRIORIDADE[l.prioridade] },
      { titulo: 'Status', valor: (l) => ROTULO_STATUS_ANOMALIA[l.status] },
      { titulo: 'Responsável', valor: (l) => l.responsavel_nome },
      { titulo: 'Prazo', valor: (l) => fmtData(l.prazo) },
      { titulo: 'Vencida', valor: (l) => (l.vencida ? 'Sim' : 'Não') },
      { titulo: 'Registrada em', valor: (l) => fmtData(l.created_at) },
      { titulo: 'Resolvida em', valor: (l) => fmtData(l.resolvida_em) },
      { titulo: 'Manutenções', valor: (l) => l.total_manutencoes },
    ], itens);
  }

  res.json({
    resumo: {
      total: itens.length,
      abertas: itens.filter((i) => i.status !== 'resolvido').length,
      vencidas: itens.filter((i) => i.vencida).length,
      por_status: contar(itens, 'status'),
      por_prioridade: contar(itens, 'prioridade'),
    },
    itens,
  });
}

/**
 * GET /api/relatorios/manutencoes
 * Filtros: predio_id, status, responsavel_id, data_inicio, data_fim (sobre a data de início).
 */
async function manutencoes(req, res) {
  const { predio_id, status, responsavel_id, data_inicio, data_fim, formato } = req.query;
  const condicoes = [];
  const valores = [];

  if (predio_id) { condicoes.push('i.predio_id = ?'); valores.push(predio_id); }
  if (status) { condicoes.push('m.status = ?'); valores.push(status); }
  if (responsavel_id) { condicoes.push('m.responsavel_id = ?'); valores.push(responsavel_id); }
  if (data_inicio) { condicoes.push('m.data_inicio >= ?'); valores.push(data_inicio); }
  if (data_fim) { condicoes.push('m.data_inicio <= ?'); valores.push(data_fim); }

  const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `SELECT
       m.id, m.anomalia_id, m.descricao, m.data_inicio, m.data_conclusao, m.status,
       a.titulo AS anomalia_titulo, a.prioridade AS anomalia_prioridade,
       p.nome AS predio_nome, amb.nome AS ambiente_nome,
       u.nome AS responsavel_nome,
       DATEDIFF(m.data_conclusao, m.data_inicio) AS duracao_dias
     FROM manutencoes m
     JOIN anomalias a ON a.id = m.anomalia_id
     JOIN inspecoes i ON i.id = a.inspecao_id
     JOIN predios p ON p.id = i.predio_id
     JOIN ambientes amb ON amb.id = a.ambiente_id
     JOIN usuarios u ON u.id = m.responsavel_id
     ${where}
     ORDER BY p.nome ASC, m.data_inicio IS NULL, m.data_inicio DESC, m.id DESC`,
    valores
  );

  if (formato === 'csv') {
    return enviarCsv(res, 'relatorio-manutencoes', [
      { titulo: 'ID', valor: (l) => l.id },
      { titulo: 'Prédio', valor: (l) => l.predio_nome },
      { titulo: 'Ambiente', valor: (l) => l.ambiente_nome },
      { titulo: 'Anomalia', valor: (l) => l.anomalia_titulo },
      { titulo: 'Prioridade', valor: (l) => ROTULO_PRIORIDADE[l.anomalia_prioridade] },
      { titulo: 'Responsável', valor: (l) => l.responsavel_nome },
      { titulo: 'Status', valor: (l) => ROTULO_STATUS_MANUTENCAO[l.status] },
      { titulo: 'Início', valor: (l) => fmtData(l.data_inicio) },
      { titulo: 'Conclusão', valor: (l) => fmtData(l.data_conclusao) },
      { titulo: 'Duração (dias)', valor: (l) => l.duracao_dias },
      { titulo: 'Descrição', valor: (l) => l.descricao },
    ], rows);
  }

  const duracoes = rows.filter((r) => r.duracao_dias !== null).map((r) => Number(r.duracao_dias));
  res.json({
    resumo: {
      total: rows.length,
      por_status: contar(rows, 'status'),
      duracao_media_dias: duracoes.length
        ? Math.round((duracoes.reduce((s, v) => s + v, 0) / duracoes.length) * 10) / 10
        : null,
    },
    itens: rows,
  });
}

module.exports = { anomalias, manutencoes };
