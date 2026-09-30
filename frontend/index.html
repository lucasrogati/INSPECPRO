import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, AlertTriangle, Flame, CalendarX, CheckCircle2, Filter, Pencil, Trash2, Camera, Search } from 'lucide-react';
import TopBar from '../components/TopBar';
import AnomaliaFormModal from '../components/AnomaliaFormModal';
import { PrioridadeBadge, StatusAnomaliaBadge, PrazoTexto } from '../components/Badges';
import anomaliaService from '../services/anomaliaService';
import predioService from '../services/predioService';
import { useAuth } from '../context/AuthContext';
import { PERFIS_GESTAO, PERFIS_EXCLUSAO, PRIORIDADE_CONFIG, STATUS_ANOMALIA_CONFIG } from '../utils/constants';

const FILTROS_INICIAL = { busca: '', predio_id: '', status: '', prioridade: '', responsavel_id: '', abertas: false, vencidas: false };

export default function AnomaliasPage() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const buscaUrl = searchParams.get('busca') || '';

  const [anomalias, setAnomalias] = useState([]);
  const [predios, setPredios] = useState([]);
  const [responsaveis, setResponsaveis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [filtros, setFiltros] = useState({ ...FILTROS_INICIAL, busca: buscaUrl });
  const [buscaDigitada, setBuscaDigitada] = useState(buscaUrl);
  const [modal, setModal] = useState({ aberto: false, anomalia: null });

  const podeEditar = PERFIS_GESTAO.includes(usuario?.tipo);
  const podeExcluir = PERFIS_EXCLUSAO.includes(usuario?.tipo);

  async function carregar() {
    setLoading(true);
    try {
      const params = {};
      if (filtros.busca) params.busca = filtros.busca;
      if (filtros.predio_id) params.predio_id = filtros.predio_id;
      if (filtros.status) params.status = filtros.status;
      if (filtros.prioridade) params.prioridade = filtros.prioridade;
      if (filtros.responsavel_id) params.responsavel_id = filtros.responsavel_id;
      if (filtros.abertas) params.abertas = 'true';
      if (filtros.vencidas) params.vencidas = 'true';
      setAnomalias(await anomaliaService.listar(params));
      setErro('');
    } catch (err) {
      setErro(err.response?.data?.message || 'Não foi possível carregar as anomalias.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    predioService.listar().then(setPredios).catch(() => {});
    anomaliaService.listarResponsaveis().then(setResponsaveis).catch(() => {});
  }, []);

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros]);

  // Busca vinda do TopBar (?busca=...), inclusive quando já se está nesta tela.
  useEffect(() => {
    setBuscaDigitada(buscaUrl);
  }, [buscaUrl]);

  // Aplica a busca por texto só após uma pequena pausa na digitação.
  useEffect(() => {
    const t = setTimeout(() => setFiltros((f) => (f.busca === buscaDigitada ? f : { ...f, busca: buscaDigitada })), 350);
    return () => clearTimeout(t);
  }, [buscaDigitada]);

  async function handleRemover(id, e) {
    e.stopPropagation();
    if (!window.confirm('Excluir esta anomalia? Fotos, histórico e manutenções vinculadas também serão removidos.')) return;
    try {
      await anomaliaService.remover(id);
      carregar();
    } catch (err) {
      setErro(err.response?.data?.message || 'Não foi possível excluir a anomalia.');
    }
  }

  const resumo = useMemo(
    () => [
      { label: 'Em aberto', valor: anomalias.filter((a) => a.status !== 'resolvido').length, icon: AlertTriangle, bg: '#fff7ed', cor: '#c2410c' },
      { label: 'Críticas em aberto', valor: anomalias.filter((a) => a.prioridade === 'critica' && a.status !== 'resolvido').length, icon: Flame, bg: '#fef2f2', cor: '#b91c1c' },
      { label: 'Com prazo vencido', valor: anomalias.filter((a) => a.vencida).length, icon: CalendarX, bg: '#fef2f2', cor: '#b91c1c' },
      { label: 'Resolvidas', valor: anomalias.filter((a) => a.status === 'resolvido').length, icon: CheckCircle2, bg: '#f0fdf4', cor: '#15803d' },
    ],
    [anomalias]
  );

  const filtrosAtivos =
    filtros.busca || filtros.predio_id || filtros.status || filtros.prioridade || filtros.responsavel_id || filtros.abertas || filtros.vencidas;

  return (
    <div className="flex flex-col" style={{ minHeight: '100%' }}>
      <TopBar title="Anomalias" subtitle={`${anomalias.length} anomalias encontradas`}>
        {podeEditar && (
          <button className="btn-primary" onClick={() => setModal({ aberto: true, anomalia: null })}>
            <Plus size={15} strokeWidth={2.5} />
            Nova Anomalia
          </button>
        )}
      </TopBar>

      <div style={{ padding: '24px 28px' }}>
        {erro && (
          <div style={{ marginBottom: 16, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 7, fontSize: 13, color: '#b91c1c' }}>
            {erro}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
          {resumo.map((r) => {
            const Icon = r.icon;
            return (
              <div key={r.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '16px 18px' }}>
                <div className="flex items-center gap-3">
                  <div style={{ width: 36, height: 36, background: r.bg, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={17} color={r.cor} strokeWidth={1.8} />
                  </div>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.1 }}>{r.valor}</div>
                    <div style={{ fontSize: 11.5, color: '#64748b', fontWeight: 500, marginTop: 2 }}>{r.label}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="card flex items-center gap-3" style={{ padding: '12px 16px', marginBottom: 20, flexWrap: 'wrap' }}>
          <div className="flex items-center gap-1.5" style={{ fontSize: 12.5, fontWeight: 600, color: '#64748b' }}>
            <Filter size={13} />
            Filtros:
          </div>

          <div className="relative">
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              className="search-input"
              placeholder="Título, categoria, ambiente…"
              value={buscaDigitada}
              onChange={(e) => setBuscaDigitada(e.target.value)}
            />
          </div>

          <select className="filter-select" value={filtros.predio_id} onChange={(e) => setFiltros((f) => ({ ...f, predio_id: e.target.value }))}>
            <option value="">Todos os prédios</option>
            {predios.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>

          <select className="filter-select" value={filtros.status} onChange={(e) => setFiltros((f) => ({ ...f, status: e.target.value }))}>
            <option value="">Todos os status</option>
            {Object.entries(STATUS_ANOMALIA_CONFIG).map(([valor, cfg]) => (
              <option key={valor} value={valor}>
                {cfg.label}
              </option>
            ))}
          </select>

          <select className="filter-select" value={filtros.prioridade} onChange={(e) => setFiltros((f) => ({ ...f, prioridade: e.target.value }))}>
            <option value="">Todas as prioridades</option>
            {Object.entries(PRIORIDADE_CONFIG).map(([valor, cfg]) => (
              <option key={valor} value={valor}>
                {cfg.label}
              </option>
            ))}
          </select>

          <select className="filter-select" value={filtros.responsavel_id} onChange={(e) => setFiltros((f) => ({ ...f, responsavel_id: e.target.value }))}>
            <option value="">Todos os responsáveis</option>
            {responsaveis.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nome}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-1.5" style={{ fontSize: 12.5, color: '#475569', cursor: 'pointer' }}>
            <input type="checkbox" checked={filtros.abertas} onChange={(e) => setFiltros((f) => ({ ...f, abertas: e.target.checked }))} />
            Só em aberto
          </label>
          <label className="flex items-center gap-1.5" style={{ fontSize: 12.5, color: '#475569', cursor: 'pointer' }}>
            <input type="checkbox" checked={filtros.vencidas} onChange={(e) => setFiltros((f) => ({ ...f, vencidas: e.target.checked }))} />
            Só vencidas
          </label>

          {filtrosAtivos && (
            <button
              className="btn-ghost"
              style={{ padding: '6px 12px', fontSize: 12.5 }}
              onClick={() => {
                setFiltros(FILTROS_INICIAL);
                setBuscaDigitada('');
              }}
            >
              Limpar filtros
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ color: '#64748b', fontSize: 13.5 }}>Carregando anomalias…</div>
        ) : anomalias.length === 0 ? (
          <div className="card" style={{ padding: 32, textAlign: 'center', color: '#64748b', fontSize: 13.5 }}>
            Nenhuma anomalia encontrada com os filtros atuais.
          </div>
        ) : (
          <div className="card" style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>#</th>
                  <th>Anomalia</th>
                  <th>Local</th>
                  <th>Prioridade</th>
                  <th>Status</th>
                  <th>Responsável</th>
                  <th>Prazo</th>
                  {(podeEditar || podeExcluir) && <th style={{ width: 90 }}>Ações</th>}
                </tr>
              </thead>
              <tbody>
                {anomalias.map((a) => (
                  <tr key={a.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/anomalias/${a.id}`)}>
                    <td style={{ color: '#94a3b8' }}>{a.id}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{a.titulo}</div>
                      <div className="flex items-center gap-2" style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 2 }}>
                        {a.categoria || 'Sem categoria'}
                        {a.total_fotos > 0 && (
                          <span className="flex items-center gap-1">
                            <Camera size={11} /> {a.total_fotos}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{a.predio_nome}</div>
                      <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 2 }}>{a.ambiente_nome}</div>
                    </td>
                    <td>
                      <PrioridadeBadge prioridade={a.prioridade} />
                    </td>
                    <td>
                      <StatusAnomaliaBadge status={a.status} />
                    </td>
                    <td>{a.responsavel_nome || <span style={{ color: '#94a3b8' }}>—</span>}</td>
                    <td>
                      <PrazoTexto prazo={a.prazo} vencida={a.vencida} />
                    </td>
                    {(podeEditar || podeExcluir) && (
                      <td>
                        <div className="flex items-center gap-2">
                          {podeEditar && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setModal({ aberto: true, anomalia: a });
                              }}
                              style={acaoBtnStyle}
                              title="Editar"
                            >
                              <Pencil size={12} />
                            </button>
                          )}
                          {podeExcluir && (
                            <button onClick={(e) => handleRemover(a.id, e)} style={{ ...acaoBtnStyle, color: '#dc2626' }} title="Excluir">
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal.aberto && (
        <AnomaliaFormModal
          anomalia={modal.anomalia}
          onClose={() => setModal({ aberto: false, anomalia: null })}
          onSalvo={() => {
            setModal({ aberto: false, anomalia: null });
            carregar();
          }}
        />
      )}
    </div>
  );
}

const acaoBtnStyle = {
  background: 'none',
  border: '1px solid #e2e8f0',
  borderRadius: 5,
  padding: '5px 7px',
  cursor: 'pointer',
  color: '#64748b',
  display: 'flex',
  alignItems: 'center',
};
