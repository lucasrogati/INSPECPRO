import { PRIORIDADE_CONFIG, STATUS_ANOMALIA_CONFIG, STATUS_MANUTENCAO_CONFIG } from '../utils/constants';
import { formatarData } from '../utils/format';

export function PrioridadeBadge({ prioridade }) {
  const cfg = PRIORIDADE_CONFIG[prioridade] || PRIORIDADE_CONFIG.media;
  return (
    <span className="priority-badge" style={{ background: cfg.bg, color: cfg.text }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.cor }} />
      {cfg.label}
    </span>
  );
}

export function StatusAnomaliaBadge({ status }) {
  const cfg = STATUS_ANOMALIA_CONFIG[status] || STATUS_ANOMALIA_CONFIG.identificado;
  const Icon = cfg.icon;
  return (
    <span className="status-badge" style={{ background: cfg.bg, color: cfg.text }}>
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

export function StatusManutencaoBadge({ status }) {
  const cfg = STATUS_MANUTENCAO_CONFIG[status] || STATUS_MANUTENCAO_CONFIG.agendada;
  const Icon = cfg.icon;
  return (
    <span className="status-badge" style={{ background: cfg.bg, color: cfg.text }}>
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

// Prazo em vermelho quando a anomalia está vencida.
export function PrazoTexto({ prazo, vencida }) {
  if (!prazo) return <span style={{ color: '#94a3b8' }}>—</span>;
  return (
    <span style={{ color: vencida ? '#b91c1c' : '#334155', fontWeight: vencida ? 700 : 400 }}>
      {formatarData(prazo)}
      {vencida && <span style={{ marginLeft: 6, fontSize: 11 }}>(vencida)</span>}
    </span>
  );
}
