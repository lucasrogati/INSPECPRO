import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Filter, Pencil, Trash2, Play, CheckCircle2, Building2, User } from 'lucide-react';
import TopBar from '../components/TopBar';
import ManutencaoFormModal from '../components/ManutencaoFormModal';
import { PrioridadeBadge, StatusManutencaoBadge } from '../components/Badges';
import manutencaoService from '../services/manutencaoService';
import predioService from '../services/predioService';
import anomaliaService from '../services/anomaliaService';
import { useAuth } from '../context/AuthContext';
import { PERFIS_GESTAO, PERFIS_EXCLUSAO, STATUS_MANUTENCAO_CONFIG } from '../utils/constants';
import { formatarData } from '../utils/format';

const FILTROS_INICIAL = { predio_id: '', status: '', responsavel_id: '', minhas: false };

export default function ManutencoesPage() {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [manutencoes, setManutencoes] = useState([]);
  const [predios, setPredios] = useState([]);
  const [responsaveis, setResponsaveis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [filtros, setFiltros] = useState(FILTROS_INICIAL);
  const [modal, setModal] = useState({ aberto: false, manutencao: null });

  const podeGerir = PERFIS_GESTAO.includes(usuario?.tipo);
  const podeExcluir = PERFIS_EXCLUSAO.includes(usuario?.tipo);

  async function carregar() {
    setLoading(true);
    try {
      const params = {};
      if (filtros.predio_id) params.predio_id = filtros.predio_id;
      if (filtros.status) params.status = filtros.status;
      if (filtros.responsavel_id) params.responsavel_id = filtros.responsavel_id;
      if (filtros.minhas) params.minhas = 'true';
      setManutencoes(await manutencaoService.listar(params));
      setErro('');
    } catch (err) {
      setErro(err.response?.data?.message || 'Não foi possível carregar as manutenções.');
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

  function podeAtualizar(m) {
    return podeGerir || (usuario?.tipo === 'manutencao' && m.responsavel_id === usuario.id);
  }

  async function handleStatus(m, status, e) {
    e.stopPropagation();
    try {
      await manutencaoService.alterarStatus(m.id, status);
      carregar();
    } catch (err) {
      setErro(err.response?.data?.message || 'Não foi possível atualizar a manutenção.');
    }
  }

  async function handleRemover(m, e) {
    e.stopPropagation();
    if (!window.confirm(`Excluir a manutenção #${m.id}?`)) return;
    try {
      await manutencaoService.remover(m.id);
      carregar();
    } catch (err) {
      setErro(err.response?.data?.message || 'Não foi possível excluir a manutenção.');
    }
  }

  const resumo = useMemo(
    () =>
      Object.entries(STATUS_MANUTENCAO_CONFIG).map(([status, cfg]) => ({
        status,
        ...cfg,
        count: manutencoes.filter((m) => m.status === status).length,
      })),
    [manutencoes]
  );

  const filtrosAtivos = filtros.predio_id || filtros.status || filtros.responsavel_id || filtros.minhas;

  return (
    <div className="flex flex-col" style={{ minHeight: '100%' }}>
      <TopBar title="Manutenções" subtitle={`${manutencoes.length} manutenções encontradas`}>
        {podeGerir && (
          <button className="btn-primary" onClick={() => setModal({ aberto: true, manutencao: null })}>
            <Plus size={15} strokeWidth={2.5} />
            Nova Manutenção
          </button>
        )}
      </TopBar>

      <div style={{ padding: '24px 28px' }}>
        {erro && (
          <div style={{ marginBottom: 16, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 7, fontSize: 13, color: '#b91c1c' }}>
            {erro}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
          {resumo.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.status} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '16px 18px' }}>
                <div className="flex items-center gap-3">
                  <div style={{ width: 36, height: 36, background: s.bg, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={17} color={s.text} strokeWidth={1.8} />
                  </div>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.1 }}>{s.count}</div>
                    <div style={{ fontSize: 11.5, color: '#64748b', fontWeight: 500, marginTop: 2 }}>{s.label}</div>
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
            {Object.entries(STATUS_MANUTENCAO_CONFIG).map(([valor, cfg]) => (
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
            <input type="checkbox" checked={filtros.minhas} onChange={(e) => setFiltros((f) => ({ ...f, minhas: e.target.checked }))} />
            Somente minhas
          </label>

          {filtrosAtivos && (
            <button className="btn-ghost" style={{ padding: '6px 12px', fontSize: 12.5 }} onClick={() => setFiltros(FILTROS_INICIAL)}>
              Limpar filtros
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ color: '#64748b', fontSize: 13.5 }}>Carregando manutenções…</div>
        ) : manutencoes.length === 0 ? (
          <div className="card" style={{ padding: 32, textAlign: 'center', color: '#64748b', fontSize: 13.5 }}>
            Nenhuma manutenção encontrada com os filtros atuais.
          </div>
        ) : (
          <div className="card" style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>#</th>
                  <th>Anomalia</th>
                  <th>Local</th>
                  <th>Responsável</th>
                  <th>Status</th>
                  <th>Início</th>
                  <th>Conclusão</th>
                  <th style={{ width: 200 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {manutencoes.map((m) => (
                  <tr key={m.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/anomalias/${m.anomalia_id}`)}>
                    <td style={{ color: '#94a3b8' }}>{m.id}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{m.anomalia_titulo}</div>
                      <div style={{ marginTop: 3 }}>
                        <PrioridadeBadge prioridade={m.anomalia_prioridade} />
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <Building2 size={12} color="#94a3b8" />
                        {m.predio_nome}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 2, paddingLeft: 18 }}>{m.ambiente_nome}</div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <User size={12} color="#94a3b8" />
                        {m.responsavel_nome}
                      </div>
                    </td>
                    <td>
                      <StatusManutencaoBadge status={m.status} />
                    </td>
                    <td>{formatarData(m.data_inicio)}</td>
                    <td>{formatarData(m.data_conclusao)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        {podeAtualizar(m) && m.status === 'agendada' && (
                          <button className="btn-ghost" style={{ padding: '4px 9px', fontSize: 12 }} onClick={(e) => handleStatus(m, 'em_andamento', e)}>
                            <Play size={11} /> Iniciar
                          </button>
                        )}
                        {podeAtualizar(m) && m.status !== 'concluida' && (
                          <button className="btn-ghost" style={{ padding: '4px 9px', fontSize: 12, color: '#15803d' }} onClick={(e) => handleStatus(m, 'concluida', e)}>
                            <CheckCircle2 size={11} /> Concluir
                          </button>
                        )}
                        {podeGerir && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setModal({ aberto: true, manutencao: m });
                            }}
                            style={acaoBtnStyle}
                            title="Editar"
                          >
                            <Pencil size={12} />
                          </button>
                        )}
                        {podeExcluir && (
                          <button onClick={(e) => handleRemover(m, e)} style={{ ...acaoBtnStyle, color: '#dc2626' }} title="Excluir">
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal.aberto && (
        <ManutencaoFormModal
          manutencao={modal.manutencao}
          onClose={() => setModal({ aberto: false, manutencao: null })}
          onSalvo={() => {
            setModal({ aberto: false, manutencao: null });
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
