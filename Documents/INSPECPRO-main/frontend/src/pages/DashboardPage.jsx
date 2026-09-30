import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Flame, CalendarX, Eye, Wrench, CheckCircle2, Building2, Clock } from 'lucide-react';
import TopBar from '../components/TopBar';
import { PrioridadeBadge, StatusManutencaoBadge, PrazoTexto } from '../components/Badges';
import dashboardService from '../services/dashboardService';
import predioService from '../services/predioService';
import { useAuth } from '../context/AuthContext';
import { PRIORIDADE_CONFIG, STATUS_ANOMALIA_CONFIG } from '../utils/constants';
import { formatarData } from '../utils/format';

function KpiCard({ titulo, valor, detalhe, icon: Icon, bg, cor, to }) {
  const conteudo = (
    <div className="kpi-card" style={{ height: '100%', boxSizing: 'border-box' }}>
      <div className="flex items-center justify-between">
        <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>{titulo}</span>
        <div style={{ width: 32, height: 32, background: bg, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color={cor} strokeWidth={1.8} />
        </div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.1 }}>{valor}</div>
      {detalhe && <div style={{ fontSize: 11.5, color: '#94a3b8' }}>{detalhe}</div>}
    </div>
  );
  return to ? (
    <Link to={to} style={{ textDecoration: 'none' }}>
      {conteudo}
    </Link>
  ) : (
    conteudo
  );
}

function Painel({ titulo, children, style }) {
  return (
    <div className="card" style={{ padding: '18px 20px', ...style }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>{titulo}</div>
      {children}
    </div>
  );
}

function BarrasHorizontais({ itens }) {
  const maximo = Math.max(1, ...itens.map((i) => i.valor));
  if (itens.every((i) => i.valor === 0)) {
    return <div style={{ fontSize: 13, color: '#94a3b8' }}>Sem dados para exibir.</div>;
  }
  return (
    <div className="flex flex-col gap-3">
      {itens.map((item) => (
        <div key={item.label}>
          <div className="flex items-center justify-between" style={{ fontSize: 12.5, marginBottom: 4 }}>
            <span style={{ color: '#475569', fontWeight: 500 }}>{item.label}</span>
            <span style={{ color: '#0f172a', fontWeight: 700 }}>{item.valor}</span>
          </div>
          <div style={{ height: 8, background: '#f1f5f9', borderRadius: 99 }}>
            <div style={{ width: `${(item.valor / maximo) * 100}%`, height: '100%', background: item.cor, borderRadius: 99, transition: 'width 0.3s ease' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function GraficoMensal({ serie }) {
  const largura = 560;
  const altura = 230;
  const margem = { esq: 30, dir: 10, topo: 16, base: 30 };
  const areaW = largura - margem.esq - margem.dir;
  const areaH = altura - margem.topo - margem.base;
  const maximo = Math.max(4, ...serie.flatMap((s) => [s.registradas, s.resolvidas]));
  const grupoW = areaW / serie.length;
  const barraW = Math.min(26, grupoW / 2 - 6);
  const y = (v) => margem.topo + areaH - (v / maximo) * areaH;
  const ticks = [0, 0.5, 1].map((f) => Math.round(maximo * f));

  return (
    <div>
      <svg viewBox={`0 0 ${largura} ${altura}`} style={{ width: '100%', height: 'auto', display: 'block' }} role="img" aria-label="Anomalias registradas e resolvidas por mês">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={margem.esq} x2={largura - margem.dir} y1={y(t)} y2={y(t)} stroke="#e2e8f0" strokeDasharray={t === 0 ? '0' : '3 3'} />
            <text x={margem.esq - 6} y={y(t) + 4} textAnchor="end" fontSize="10" fill="#94a3b8">
              {t}
            </text>
          </g>
        ))}
        {serie.map((s, idx) => {
          const x0 = margem.esq + idx * grupoW + grupoW / 2;
          return (
            <g key={s.mes}>
              {[
                { valor: s.registradas, cor: '#1a56db', dx: -barraW - 2 },
                { valor: s.resolvidas, cor: '#22c55e', dx: 2 },
              ].map((b) => (
                <g key={b.cor}>
                  <rect x={x0 + b.dx} y={y(b.valor)} width={barraW} height={margem.topo + areaH - y(b.valor)} rx="3" fill={b.cor} />
                  {b.valor > 0 && (
                    <text x={x0 + b.dx + barraW / 2} y={y(b.valor) - 4} textAnchor="middle" fontSize="10" fontWeight="600" fill="#475569">
                      {b.valor}
                    </text>
                  )}
                </g>
              ))}
              <text x={x0} y={altura - 10} textAnchor="middle" fontSize="11" fill="#64748b">
                {s.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex items-center gap-4" style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>
        <span className="flex items-center gap-1.5">
          <span style={{ width: 10, height: 10, background: '#1a56db', borderRadius: 2 }} /> Registradas
        </span>
        <span className="flex items-center gap-1.5">
          <span style={{ width: 10, height: 10, background: '#22c55e', borderRadius: 2 }} /> Resolvidas
        </span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { usuario } = useAuth();
  const [dados, setDados] = useState(null);
  const [predios, setPredios] = useState([]);
  const [predioId, setPredioId] = useState('');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    predioService.listar().then(setPredios).catch(() => {});
  }, []);

  useEffect(() => {
    async function carregar() {
      setLoading(true);
      try {
        setDados(await dashboardService.obter(predioId ? { predio_id: predioId } : {}));
        setErro('');
      } catch (err) {
        setErro(err.response?.data?.message || 'Não foi possível carregar o dashboard.');
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, [predioId]);

  const k = dados?.kpis;

  return (
    <div className="flex flex-col" style={{ minHeight: '100%' }}>
      <TopBar title="Dashboard" subtitle={`Bem-vindo, ${usuario?.nome?.split(' ')[0] || ''}`}>
        <select className="filter-select" value={predioId} onChange={(e) => setPredioId(e.target.value)}>
          <option value="">Todos os prédios</option>
          {predios.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
      </TopBar>

      <div style={{ padding: '24px 28px' }}>
        {erro && (
          <div style={{ marginBottom: 16, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 7, fontSize: 13, color: '#b91c1c' }}>
            {erro}
          </div>
        )}

        {loading && !dados ? (
          <div style={{ color: '#64748b', fontSize: 13.5 }}>Carregando indicadores…</div>
        ) : (
          dados && (
            <div style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.15s' }}>
              {/* KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14, marginBottom: 20 }}>
                <KpiCard titulo="Anomalias em aberto" valor={k.anomalias_abertas} detalhe={`${k.anomalias_total} registradas no total`} icon={AlertTriangle} bg="#fff7ed" cor="#c2410c" to="/anomalias" />
                <KpiCard titulo="Críticas em aberto" valor={k.anomalias_criticas} detalhe="Exigem ação imediata" icon={Flame} bg="#fef2f2" cor="#b91c1c" to="/anomalias" />
                <KpiCard titulo="Prazo vencido" valor={k.anomalias_vencidas} detalhe="Anomalias atrasadas" icon={CalendarX} bg="#fef2f2" cor="#b91c1c" to="/anomalias" />
                <KpiCard titulo="Aguardando verificação" valor={k.aguardando_verificacao} detalhe="Manutenção concluída" icon={Eye} bg="#faf5ff" cor="#7e22ce" to="/anomalias" />
                <KpiCard titulo="Manutenções ativas" valor={k.manutencoes_ativas} detalhe="Agendadas ou em andamento" icon={Wrench} bg="#eff6ff" cor="#1d4ed8" to="/manutencoes" />
                <KpiCard
                  titulo="Taxa de resolução"
                  valor={`${k.taxa_resolucao}%`}
                  detalhe={k.tempo_medio_resolucao_dias !== null ? `Tempo médio: ${k.tempo_medio_resolucao_dias} dia(s)` : `${k.anomalias_resolvidas} resolvidas`}
                  icon={CheckCircle2}
                  bg="#f0fdf4"
                  cor="#15803d"
                />
              </div>

              {/* Gráficos */}
              <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 14, marginBottom: 14 }}>
                <Painel titulo="Evolução mensal (últimos 6 meses)">
                  <GraficoMensal serie={dados.serie_mensal} />
                </Painel>
                <Painel titulo="Em aberto por prioridade">
                  <BarrasHorizontais
                    itens={Object.entries(PRIORIDADE_CONFIG)
                      .reverse()
                      .map(([chave, cfg]) => ({ label: cfg.label, valor: dados.anomalias_por_prioridade[chave] || 0, cor: cfg.cor }))}
                  />
                </Painel>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: 14, marginBottom: 14 }}>
                <Painel titulo="Anomalias por status">
                  <BarrasHorizontais
                    itens={Object.entries(STATUS_ANOMALIA_CONFIG).map(([chave, cfg]) => ({
                      label: cfg.label,
                      valor: dados.anomalias_por_status[chave] || 0,
                      cor: cfg.cor,
                    }))}
                  />
                </Painel>
                <Painel titulo="Prédios com mais pendências">
                  {dados.por_predio.length === 0 ? (
                    <div style={{ fontSize: 13, color: '#94a3b8' }}>Nenhum prédio cadastrado.</div>
                  ) : (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Prédio</th>
                          <th style={{ textAlign: 'right' }}>Em aberto</th>
                          <th style={{ textAlign: 'right' }}>Críticas</th>
                          <th style={{ textAlign: 'right' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dados.por_predio.map((p) => (
                          <tr key={p.id}>
                            <td>
                              <Link to={`/predios/${p.id}`} className="flex items-center gap-2" style={{ color: '#0f172a', fontWeight: 600, textDecoration: 'none' }}>
                                <Building2 size={13} color="#94a3b8" />
                                {p.nome}
                              </Link>
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>{p.abertas}</td>
                            <td style={{ textAlign: 'right', color: p.criticas > 0 ? '#b91c1c' : '#94a3b8', fontWeight: p.criticas > 0 ? 700 : 400 }}>{p.criticas}</td>
                            <td style={{ textAlign: 'right', color: '#64748b' }}>{p.total_anomalias}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </Painel>
              </div>

              {/* Listas de ação */}
              <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 14 }}>
                <Painel titulo="Requer atenção">
                  {dados.atencao.length === 0 ? (
                    <div style={{ fontSize: 13, color: '#94a3b8' }}>Nenhuma anomalia em aberto. 🎉</div>
                  ) : (
                    <div className="flex flex-col">
                      {dados.atencao.map((a) => (
                        <Link
                          key={a.id}
                          to={`/anomalias/${a.id}`}
                          className="flex items-center justify-between gap-3"
                          style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9', textDecoration: 'none' }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.titulo}</div>
                            <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 2 }}>
                              {a.predio_nome} · {a.ambiente_nome}
                              {a.responsavel_nome ? ` · ${a.responsavel_nome}` : ' · Sem responsável'}
                            </div>
                          </div>
                          <div className="flex items-center gap-3" style={{ flexShrink: 0, fontSize: 12.5 }}>
                            <PrazoTexto prazo={a.prazo} vencida={a.vencida} />
                            <PrioridadeBadge prioridade={a.prioridade} />
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </Painel>

                <Painel titulo="Próximas manutenções">
                  {dados.proximas_manutencoes.length === 0 ? (
                    <div style={{ fontSize: 13, color: '#94a3b8' }}>Nenhuma manutenção agendada.</div>
                  ) : (
                    <div className="flex flex-col">
                      {dados.proximas_manutencoes.map((m) => (
                        <Link
                          key={m.id}
                          to={`/anomalias/${m.anomalia_id}`}
                          style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9', textDecoration: 'none', display: 'block' }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.anomalia_titulo}</div>
                            <StatusManutencaoBadge status={m.status} />
                          </div>
                          <div className="flex items-center gap-1.5" style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 3 }}>
                            <Clock size={11} />
                            {formatarData(m.data_inicio)} · {m.responsavel_nome} · {m.predio_nome}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </Painel>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
