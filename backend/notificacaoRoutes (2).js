const TIPOS_USUARIO = ['administrador', 'engenheiro', 'manutencao', 'gestor'];
const STATUS_INSPECAO = ['planejada', 'em_andamento', 'concluida'];

// Fase 4 — anomalias
const PRIORIDADES = ['baixa', 'media', 'alta', 'critica'];
const STATUS_ANOMALIA = ['identificado', 'pendente', 'em_manutencao', 'aguardando_verificacao', 'resolvido'];

// Fase 5 — manutenções
const STATUS_MANUTENCAO = ['agendada', 'em_andamento', 'concluida'];

const ROTULOS_PRIORIDADE = { baixa: 'baixa', media: 'média', alta: 'alta', critica: 'crítica' };
function rotuloPrioridade(p) {
  return ROTULOS_PRIORIDADE[p] || p;
}

function isEmailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '');
}

// Aceita apenas datas no formato YYYY-MM-DD (o mesmo enviado por <input type="date">).
function isDataValida(valor) {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const d = new Date(`${valor}T00:00:00`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === valor;
}

module.exports = {
  TIPOS_USUARIO,
  STATUS_INSPECAO,
  PRIORIDADES,
  STATUS_ANOMALIA,
  STATUS_MANUTENCAO,
  rotuloPrioridade,
  isEmailValido,
  isDataValida,
};
