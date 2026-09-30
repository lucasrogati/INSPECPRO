import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  ClipboardList,
  Clock,
  Loader2,
  CheckCircle2,
  X,
  Building2,
  User,
  Calendar,
  Pencil,
  Trash2,
  Filter,
} from 'lucide-react';
import TopBar from '../components/TopBar';
import inspecaoService from '../services/inspecaoService';
import predioService from '../services/predioService';
import usuarioService from '../services/usuarioService';
import { useAuth } from '../context/AuthContext';

const STATUS_CONFIG = {
  planejada: { label: 'Planejada', bg: '#f1f5f9', text: '#475569', icon: Clock },
  em_andamento: { label: 'Em Andamento', bg: '#fffbeb', text: '#d97706', icon: Loader2 },
  concluida: { label: 'Concluída', bg: '#f0fdf4', text: '#15803d', icon: CheckCircle2 },
};

const FORM_INICIAL = { predio_id: '', usuario_id: '', data_inspecao: '', observacoes: '', status: 'planejada' };

const FILTROS_INICIAL = { predio_id: '', status: '', data: '' };

function toInputDate(valor) {
  if (!valor) return '';
  return String(valor).slice(0, 10);
}

function formatarData(valor) {
  if (!valor) return '—';
  const [ano, mes, dia] = String(valor).slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
}

export default function InspectionsPage() {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [inspecoes, setInspecoes] = useState([]);
  const [predios, setPredios] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const [filtros, setFiltros] = useState(FILTROS_INICIAL);

  const [showModal, setShowModal] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(FORM_INICIAL);
  const [salvando, setSalvando] = useState(false);

  // Permissões: administrador/gestor gerenciam tudo; engenheiro cria e atualiza; demais só visualizam.
  const podeCriarOuEditar = ['administrador', 'gestor', 'engenheiro'].includes(usuario?.tipo);
  const podeExcluir = ['administrador', 'gestor'].includes(usuario?.tipo);

  async function carregar() {
    setLoading(true);
    try {
      const params = {};
      if (filtros.predio_id) params.predio_id = filtros.predio_id;
      if (filtros.status) params.status = filtros.status;
      if (filtros.data) {
        params.data_inicio = filtros.data;
        params.data_fim = filtros.data;
      }
      const data = await inspecaoService.listar(params);
      setInspecoes(data);
      setErro('');
    } catch (err) {
      setErro(err.response?.data?.message || 'Não foi possível carregar as inspeções.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function carregarAuxiliares() {
      try {
        const [predioData, usuarioData] = await Promise.all([predioService.listar(), usuarioService.listar()]);
        setPredios(predioData);
        setUsuarios(usuarioData);
      } catch {
        // Falha ao carregar auxiliares não deve travar a listagem principal.
      }
    }
    carregarAuxiliares();
  }, []);

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros]);

  function abrirNovo() {
    setEditandoId(null);
    setForm({ ...FORM_INICIAL, usuario_id: usuario?.id ? String(usuario.id) : '' });
    setShowModal(true);
  }

  function abrirEdicao(inspecao, e) {
    e?.stopPropagation();
    setEditandoId(inspecao.id);
    setForm({
      predio_id: String(inspecao.predio_id),
      usuario_id: String(inspecao.usuario_id),
      data_inspecao: toInputDate(inspecao.data_inspecao),
      observacoes: inspecao.observacoes || '',
      status: inspecao.status,
    });
    setShowModal(true);
  }

  async function handleSalvar() {
    if (!form.predio_id || !form.usuario_id || !form.data_inspecao) return;
    setSalvando(true);
    try {
      if (editandoId) {
        await inspecaoService.atualizar(editandoId, form);
      } else {
        await inspecaoService.criar(form);
      }
      setShowModal(false);
      carregar();
    } catch (err) {
      setErro(err.response?.data?.message || 'Não foi possível salvar a inspeção.');
    } finally {
      setSalvando(false);
    }
  }

  async function handleRemover(id, e) {
    e?.stopPropagation();
    if (!window.confirm('Excluir esta inspeção? Esta ação não pode ser desfeita.')) return;
    try {
      await inspecaoService.remover(id);
      carregar();
    } catch (err) {
      setErro(err.response?.data?.message || 'Não foi possível excluir a inspeção.');
    }
  }

  const resumoPorStatus = useMemo(
    () =>
      Object.keys(STATUS_CONFIG).map((status) => ({
        status,
        ...STATUS_CONFIG[status],
        count: inspecoes.filter((i) => i.status === status).length,
      })),
    [inspecoes]
  );

  return (
    <div className="flex flex-col" style={{ minHeight: '100%' }}>
      <TopBar title="Inspeções" subtitle={`${inspecoes.length} inspeções encontradas`}>
        {podeCriarOuEditar && (
          <button className="btn-primary" onClick={abrirNovo}>
            <Plus size={15} strokeWidth={2.5} />
            Nova Inspeção
          </button>
        )}
      </TopBar>

      <div style={{ padding: '24px 28px' }}>
        {erro && (
          <div style={{ marginBottom: 16, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 7, fontSize: 13, color: '#b91c1c' }}>
            {erro}
          </div>
        )}

        {/* Resumo por status */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
          {resumoPorStatus.map((s) => {
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

        {/* Filtros */}
        <div className="card flex items-center gap-3" style={{ padding: '12px 16px', marginBottom: 20, flexWrap: 'wrap' }}>
          <div className="flex items-center gap-1.5" style={{ fontSize: 12.5, fontWeight: 600, color: '#64748b' }}>
            <Filter size={13} />
            Filtros:
          </div>

          <select
            className="filter-select"
            value={filtros.predio_id}
            onChange={(e) => setFiltros((f) => ({ ...f, predio_id: e.target.value }))}
          >
            <option value="">Todos os prédios</option>
            {predios.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={filtros.status}
            onChange={(e) => setFiltros((f) => ({ ...f, status: e.target.value }))}
          >
            <option value="">Todos os status</option>
            {Object.entries(STATUS_CONFIG).map(([valor, cfg]) => (
              <option key={valor} value={valor}>
                {cfg.label}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={filtros.data}
            onChange={(e) => setFiltros((f) => ({ ...f, data: e.target.value }))}
            className="filter-select"
            style={{ cursor: 'text' }}
          />

          {(filtros.predio_id || filtros.status || filtros.data) && (
            <button className="btn-ghost" style={{ padding: '6px 12px', fontSize: 12.5 }} onClick={() => setFiltros(FILTROS_INICIAL)}>
              Limpar filtros
            </button>
          )}
        </div>

        {/* Listagem */}
        {loading ? (
          <div style={{ color: '#64748b', fontSize: 13.5 }}>Carregando inspeções…</div>
        ) : inspecoes.length === 0 ? (
          <div className="card" style={{ padding: 32, textAlign: 'center', color: '#64748b', fontSize: 13.5 }}>
            Nenhuma inspeção encontrada com os filtros atuais.
          </div>
        ) : (
          <div className="card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Prédio</th>
                  <th>Data</th>
                  <th>Responsável</th>
                  <th>Status</th>
                  <th>Observações</th>
                  <th style={{ width: 140 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {inspecoes.map((insp) => {
                  const cfg = STATUS_CONFIG[insp.status] || STATUS_CONFIG.planejada;
                  const Icon = cfg.icon;
                  return (
                    <tr key={insp.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/inspecoes/${insp.id}`)}>
                      <td>
                        <div className="flex items-center gap-2">
                          <Building2 size={13} color="#94a3b8" />
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>{insp.predio_nome}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <Calendar size={12} color="#94a3b8" />
                          {formatarData(insp.data_inspecao)}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <User size={12} color="#94a3b8" />
                          {insp.responsavel_nome}
                        </div>
                      </td>
                      <td>
                        <span className="status-badge" style={{ background: cfg.bg, color: cfg.text }}>
                          <Icon size={11} />
                          {cfg.label}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            maxWidth: 220,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            color: '#64748b',
                          }}
                        >
                          {insp.observacoes || '—'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          {podeCriarOuEditar && (
                            <button onClick={(e) => abrirEdicao(insp, e)} style={acaoBtnStyle} title="Editar">
                              <Pencil size={12} />
                            </button>
                          )}
                          {podeExcluir && (
                            <button onClick={(e) => handleRemover(insp.id, e)} style={{ ...acaoBtnStyle, color: '#dc2626' }} title="Excluir">
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div style={{ background: '#fff', borderRadius: 10, width: 520, maxHeight: '88vh', overflowY: 'auto' }}>
            <div className="flex items-center justify-between" style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                  {editandoId ? 'Editar Inspeção' : 'Nova Inspeção'}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Preencha os dados da inspeção</div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', borderRadius: 5, padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px 24px' }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Prédio</label>
                <select
                  className="filter-select"
                  style={{ width: '100%', padding: '9px 28px 9px 12px' }}
                  value={form.predio_id}
                  onChange={(e) => setForm((p) => ({ ...p, predio_id: e.target.value }))}
                >
                  <option value="">Selecione um prédio</option>
                  {predios.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 5 }}>
                    Data da inspeção
                  </label>
                  <input
                    type="date"
                    value={form.data_inspecao}
                    onChange={(e) => setForm((p) => ({ ...p, data_inspecao: e.target.value }))}
                    style={modalInputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Status</label>
                  <select
                    className="filter-select"
                    style={{ width: '100%', padding: '9px 28px 9px 12px' }}
                    value={form.status}
                    onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                  >
                    {Object.entries(STATUS_CONFIG).map(([valor, cfg]) => (
                      <option key={valor} value={valor}>
                        {cfg.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Responsável</label>
                <select
                  className="filter-select"
                  style={{ width: '100%', padding: '9px 28px 9px 12px' }}
                  value={form.usuario_id}
                  onChange={(e) => setForm((p) => ({ ...p, usuario_id: e.target.value }))}
                >
                  <option value="">Selecione um responsável</option>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 5 }}>
                  Observações
                </label>
                <textarea
                  rows={3}
                  value={form.observacoes}
                  onChange={(e) => setForm((p) => ({ ...p, observacoes: e.target.value }))}
                  placeholder="Notas gerais sobre a inspeção…"
                  style={{ ...modalInputStyle, resize: 'vertical', fontFamily: 'Inter, sans-serif' }}
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button className="btn-ghost" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button className="btn-primary" onClick={handleSalvar} disabled={salvando}>
                  <ClipboardList size={14} />
                  {salvando ? 'Salvando…' : 'Salvar Inspeção'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const modalInputStyle = {
  width: '100%',
  fontSize: 13.5,
  color: '#0f172a',
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 6,
  padding: '9px 12px',
  outline: 'none',
  boxSizing: 'border-box',
};

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
