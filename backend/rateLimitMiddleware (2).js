const { pool } = require('../config/db');

const NOMES_MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function num(valor) {
  return Number(valor || 0);
}

// Transforma [{chave: 'alta', total: 3}, ...] em { alta: 3 }.
function indexar(rows, chave) {
  return rows.reduce((acc, r) => {
    acc[r[chave]] = num(r.total);
    return acc;
  }, {});
}

// Últimos 6 meses (incluindo o atual), do mais antigo ao mais recente.
function ultimosMeses(qtd = 6) {
  const agora = new Date();
  const meses = [];
  for (let k = qtd - 1; k >= 0; k -= 1) {
    const d = new Date(agora.getFullYear(), agora.getMonth() - k, 1);
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    meses.push({ chave: `${d.getFullYear()}-${mes}`, label: `${NOMES_MESES[d.getMonth()]}/${String(d.getFullYear()).slice(2)}` });
  }
  return meses;
}

/**
 * GET /api/dashboard
 * Filtro opcional: predio_id (restringe inspeções, anomalias e manutenções ao prédio).
 */
async function obter(req, res) {
  const predioId = req.query.predio_id || null;

  // Condições reutilizáveis (anomalias e manutenções chegam ao prédio via inspeção).
  const andPredio = predioId ? 'AND i.predio_id = ?' : '';
  const wherePredio = predioId ? 'WHERE i.predio_id = ?' : '';
  const p = predioId ? [predioId] : [];

  const JOIN_ANOMALIA = 'FROM anomalias a JOIN inspecoes i ON i.id = a.inspecao_id';
  const JOIN_MANUTENCAO =
    'FROM manutencoes m JOIN anomalias a ON a.id = m.anomalia_id JOIN inspecoes i ON i.id = a.inspecao_id';

  const meses = ultimosMeses(6);
  const inicioSerie = `${meses[0].chave}-01`;

  const [
    [[totalPredios]],
    [inspecoesStatus],
    [[resumoAnomalias]],
    [anomaliasStatus],
    [anomaliasPrioridade],
    [manutencoesStatus],
    [[tempoMedio]],
    [registradas],
    [resolvidas],
    [porPredio],
    [atencao],
    [proximasManutencoes],
  ] = await Promise.all([
    pool.query(predioId ? 'SELECT COUNT(*) AS total FROM predios WHERE id = ?' : 'SELECT COUNT(*) AS total FROM predios', p),

    pool.query(`SELECT i.status, COUNT(*) AS total FROM inspecoes i ${wherePredio} GROUP BY i.status`, p),

    pool.query(
      `SELECT
         COUNT(*) AS total,
         COALESCE(SUM(a.status <> 'resolvido'), 0) AS abertas,
         COALESCE(SUM(a.status = 'resolvido'), 0) AS resolvidas,
         COALESCE(SUM(a.status = 'aguardando_verificacao'), 0) AS aguardando_verificacao,
         COALESCE(SUM(a.prioridade = 'critica' AND a.status <> 'resolvido'), 0) AS criticas,
         COALESCE(SUM(a.prazo IS NOT NULL AND a.prazo < CURDATE() AND a.status <> 'resolvido'), 0) AS vencidas
       ${JOIN_ANOMALIA} ${wherePredio}`,
      p
    ),

    pool.query(`SELECT a.status, COUNT(*) AS total ${JOIN_ANOMALIA} ${wherePredio} GROUP BY a.status`, p),

    pool.query(
      `SELECT a.prioridade, COUNT(*) AS total ${JOIN_ANOMALIA}
       WHERE a.status <> 'resolvido' ${andPredio} GROUP BY a.prioridade`,
      p
    ),

    pool.query(`SELECT m.status, COUNT(*) AS total ${JOIN_MANUTENCAO} ${wherePredio} GROUP BY m.status`, p),

    // Tempo médio (em dias) entre o registro da anomalia e a última vez em que foi marcada como resolvida.
    pool.query(
      `SELECT AVG(DATEDIFF(r.resolvida_em, a.created_at)) AS dias
       ${JOIN_ANOMALIA}
       JOIN (
         SELECT anomalia_id, MAX(data) AS resolvida_em
         FROM historico_anomalia WHERE status_novo = 'resolvido' GROUP BY anomalia_id
       ) r ON r.anomalia_id = a.id
       WHERE a.status = 'resolvido' ${andPredio}`,
      p
    ),

    pool.query(
      `SELECT DATE_FORMAT(a.created_at, '%Y-%m') AS mes, COUNT(*) AS total ${JOIN_ANOMALIA}
       WHERE a.created_at >= ? ${andPredio} GROUP BY mes`,
      [inicioSerie, ...p]
    ),

    pool.query(
      `SELECT DATE_FORMAT(h.data, '%Y-%m') AS mes, COUNT(DISTINCT h.anomalia_id) AS total
       FROM historico_anomalia h
       JOIN anomalias a ON a.id = h.anomalia_id
       JOIN inspecoes i ON i.id = a.inspecao_id
       WHERE h.status_novo = 'resolvido' AND h.data >= ? ${andPredio} GROUP BY mes`,
      [inicioSerie, ...p]
    ),

    pool.query(
      `SELECT pr.id, pr.nome,
              COUNT(a.id) AS total_anomalias,
              COALESCE(SUM(a.status <> 'resolvido'), 0) AS abertas,
              COALESCE(SUM(a.prioridade = 'critica' AND a.status <> 'resolvido'), 0) AS criticas
       FROM predios pr
       LEFT JOIN inspecoes i ON i.predio_id = pr.id
       LEFT JOIN anomalias a ON a.inspecao_id = i.id
       ${predioId ? 'WHERE pr.id = ?' : ''}
       GROUP BY pr.id, pr.nome
       ORDER BY abertas DESC, criticas DESC, pr.nome ASC
       LIMIT 8`,
      p
    ),

    pool.query(
      `SELECT a.id, a.titulo, a.prioridade, a.status, a.prazo,
              (a.prazo IS NOT NULL AND a.prazo < CURDATE()) AS vencida,
              pr.nome AS predio_nome, amb.nome AS ambiente_nome, u.nome AS responsavel_nome
       ${JOIN_ANOMALIA}
       JOIN predios pr ON pr.id = i.predio_id
       JOIN ambientes amb ON amb.id = a.ambiente_id
       LEFT JOIN usuarios u ON u.id = a.responsavel_id
       WHERE a.status <> 'resolvido' ${andPredio}
       ORDER BY vencida DESC, FIELD(a.prioridade, 'critica', 'alta', 'media', 'baixa'), (a.prazo IS NULL), a.prazo ASC
       LIMIT 6`,
      p
    ),

    pool.query(
      `SELECT m.id, m.anomalia_id, m.status, m.data_inicio, a.titulo AS anomalia_titulo,
              pr.nome AS predio_nome, u.nome AS responsavel_nome
       ${JOIN_MANUTENCAO}
       JOIN predios pr ON pr.id = i.predio_id
       JOIN usuarios u ON u.id = m.responsavel_id
       WHERE m.status IN ('agendada', 'em_andamento') ${andPredio}
       ORDER BY FIELD(m.status, 'em_andamento', 'agendada'), (m.data_inicio IS NULL), m.data_inicio ASC
       LIMIT 5`,
      p
    ),
  ]);

  const registradasPorMes = indexar(registradas, 'mes');
  const resolvidasPorMes = indexar(resolvidas, 'mes');

  const totalAnomalias = num(resumoAnomalias.total);
  const inspecoes = indexar(inspecoesStatus, 'status');
  const manutencoes = indexar(manutencoesStatus, 'status');

  res.json({
    predio_id: predioId ? Number(predioId) : null,
    kpis: {
      predios: num(totalPredios.total),
      inspecoes_total: Object.values(inspecoes).reduce((s, v) => s + v, 0),
      inspecoes_em_andamento: inspecoes.em_andamento || 0,
      anomalias_total: totalAnomalias,
      anomalias_abertas: num(resumoAnomalias.abertas),
      anomalias_criticas: num(resumoAnomalias.criticas),
      anomalias_vencidas: num(resumoAnomalias.vencidas),
      aguardando_verificacao: num(resumoAnomalias.aguardando_verificacao),
      anomalias_resolvidas: num(resumoAnomalias.resolvidas),
      taxa_resolucao: totalAnomalias ? Math.round((num(resumoAnomalias.resolvidas) / totalAnomalias) * 100) : 0,
      manutencoes_ativas: (manutencoes.agendada || 0) + (manutencoes.em_andamento || 0),
      tempo_medio_resolucao_dias: tempoMedio.dias === null ? null : Math.round(num(tempoMedio.dias) * 10) / 10,
    },
    inspecoes_por_status: inspecoes,
    anomalias_por_status: indexar(anomaliasStatus, 'status'),
    anomalias_por_prioridade: indexar(anomaliasPrioridade, 'prioridade'),
    manutencoes_por_status: manutencoes,
    serie_mensal: meses.map((m) => ({
      mes: m.chave,
      label: m.label,
      registradas: registradasPorMes[m.chave] || 0,
      resolvidas: resolvidasPorMes[m.chave] || 0,
    })),
    por_predio: porPredio.map((r) => ({
      id: r.id,
      nome: r.nome,
      total_anomalias: num(r.total_anomalias),
      abertas: num(r.abertas),
      criticas: num(r.criticas),
    })),
    atencao: atencao.map((r) => ({ ...r, vencida: Boolean(r.vencida) })),
    proximas_manutencoes: proximasManutencoes,
  });
}

module.exports = { obter };
