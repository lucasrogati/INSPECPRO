import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Building2, AlertTriangle, ClipboardList, X, MapPin, Layers } from 'lucide-react';
import TopBar from '../components/TopBar';
import predioService from '../services/predioService';

const TYPE_COLORS = {
  Comercial: { bg: '#eff6ff', text: '#1d4ed8' },
  Residencial: { bg: '#f0fdf4', text: '#15803d' },
  Industrial: { bg: '#fff7ed', text: '#c2410c' },
  Hospitalar: { bg: '#fdf4ff', text: '#7e22ce' },
  Misto: { bg: '#f8fafc', text: '#475569' },
  Educacional: { bg: '#ecfeff', text: '#0891b2' },
};

const TIPOS = ['Comercial', 'Residencial', 'Industrial', 'Hospitalar', 'Misto', 'Educacional'];

const FORM_INICIAL = { nome: '', endereco: '', tipo: 'Comercial', observacoes: '' };

export default function BuildingsPage() {
  const [predios, setPredios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState(FORM_INICIAL);
  const navigate = useNavigate();

  async function carregar() {
    setLoading(true);
    try {
      const data = await predioService.listar();
      setPredios(data);
    } catch (err) {
      setErro(err.response?.data?.message || 'Não foi possível carregar os prédios.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function handleSalvar() {
    if (!form.nome || !form.endereco || !form.tipo) return;
    setSalvando(true);
    try {
      await predioService.criar(form);
      setShowModal(false);
      setForm(FORM_INICIAL);
      carregar();
    } catch (err) {
      setErro(err.response?.data?.message || 'Não foi possível salvar o prédio.');
    } finally {
      setSalvando(false);
    }
  }

  const resumoPorTipo = TIPOS.map((t) => ({
    label: t,
    count: predios.filter((p) => p.tipo === t).length,
    color: TYPE_COLORS[t]?.text || '#64748b',
  })).filter((t) => t.count > 0);

  return (
    <div className="flex flex-col" style={{ minHeight: '100%' }}>
      <TopBar title="Prédios" subtitle={`${predios.length} edificações cadastradas`}>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={15} strokeWidth={2.5} />
          Cadastrar Prédio
        </button>
      </TopBar>

      <div style={{ padding: '24px 28px' }}>
        {erro && (
          <div style={{ marginBottom: 16, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 7, fontSize: 13, color: '#b91c1c' }}>
            {erro}
          </div>
        )}

        {loading ? (
          <div style={{ color: '#64748b', fontSize: 13.5 }}>Carregando prédios…</div>
        ) : predios.length === 0 ? (
          <div className="card" style={{ padding: 32, textAlign: 'center', color: '#64748b', fontSize: 13.5 }}>
            Nenhum prédio cadastrado ainda. Clique em "Cadastrar Prédio" para começar.
          </div>
        ) : (
          <>
            {resumoPorTipo.length > 0 && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${Math.min(resumoPorTipo.length, 4)}, 1fr)`,
                  gap: 12,
                  marginBottom: 24,
                }}
              >
                {resumoPorTipo.map((t) => (
                  <div
                    key={t.label}
                    style={{
                      background: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: 7,
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <div style={{ width: 8, height: 32, borderRadius: 3, background: t.color, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                        {t.count}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#64748b', fontWeight: 500 }}>{t.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              {predios.map((p) => {
                const typeStyle = TYPE_COLORS[p.tipo] || { bg: '#f8fafc', text: '#64748b' };
                return (
                  <div
                    key={p.id}
                    className="card"
                    style={{ padding: '22px 24px', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                    onClick={() => navigate(`/predios/${p.id}`)}
                    onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')}
                    onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
                  >
                    <div className="flex items-start justify-between" style={{ marginBottom: 14 }}>
                      <div className="flex items-start gap-3">
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            background: '#eff6ff',
                            borderRadius: 9,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Building2 size={22} color="#1a56db" strokeWidth={1.6} />
                        </div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                            {p.nome}
                          </div>
                          <div className="flex items-center gap-1.5" style={{ marginTop: 5 }}>
                            <MapPin size={11} color="#94a3b8" />
                            <span style={{ fontSize: 12, color: '#64748b' }}>{p.endereco}</span>
                          </div>
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: 11.5,
                          fontWeight: 600,
                          padding: '3px 9px',
                          borderRadius: 4,
                          background: typeStyle.bg,
                          color: typeStyle.text,
                          flexShrink: 0,
                        }}
                      >
                        {p.tipo}
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        background: '#f8fafc',
                        borderRadius: 7,
                        border: '1px solid #f1f5f9',
                        overflow: 'hidden',
                        marginBottom: 14,
                      }}
                    >
                      {[
                        { label: 'Ambientes', value: p.total_ambientes, icon: Layers },
                        { label: 'Inspeções', value: p.total_inspecoes, icon: ClipboardList },
                        { label: 'Pendentes', value: p.anomalias_pendentes, icon: AlertTriangle },
                      ].map((s, i) => {
                        const Icon = s.icon;
                        return (
                          <div key={i} style={{ padding: '11px 14px', borderRight: i < 2 ? '1px solid #e2e8f0' : undefined, textAlign: 'center' }}>
                            <div
                              style={{
                                fontSize: 18,
                                fontWeight: 800,
                                color: s.label === 'Pendentes' && s.value > 0 ? '#d97706' : '#0f172a',
                                letterSpacing: '-0.02em',
                              }}
                            >
                              {s.value}
                            </div>
                            <div style={{ fontSize: 10.5, color: '#94a3b8', fontWeight: 500, marginTop: 2 }}>
                              {s.label}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between">
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>
                        Última inspeção:{' '}
                        <span style={{ color: '#334155', fontWeight: 600 }}>
                          {p.ultima_inspecao || '—'}
                        </span>
                      </div>
                      {p.anomalias_criticas > 0 && (
                        <div
                          className="flex items-center gap-1.5"
                          style={{ fontSize: 12, fontWeight: 600, color: '#dc2626', background: '#fef2f2', padding: '3px 9px', borderRadius: 4 }}
                        >
                          <AlertTriangle size={12} />
                          {p.anomalias_criticas} crítica{p.anomalias_criticas > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
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
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Cadastrar Prédio</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Preencha os dados da edificação</div>
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
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 5 }}>
                  Nome do prédio
                </label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
                  placeholder="Ex: Torre Empresarial Centro"
                  style={modalInputStyle}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 5 }}>
                  Endereço completo
                </label>
                <input
                  type="text"
                  value={form.endereco}
                  onChange={(e) => setForm((p) => ({ ...p, endereco: e.target.value }))}
                  placeholder="Rua, número, bairro, cidade/UF"
                  style={modalInputStyle}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 5 }}>
                  Tipo de edificação
                </label>
                <select
                  className="filter-select"
                  style={{ width: '100%', padding: '9px 28px 9px 12px' }}
                  value={form.tipo}
                  onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value }))}
                >
                  {TIPOS.map((t) => (
                    <option key={t}>{t}</option>
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
                  placeholder="Informações complementares sobre a edificação…"
                  style={{ ...modalInputStyle, resize: 'vertical', fontFamily: 'Inter, sans-serif' }}
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button className="btn-ghost" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button className="btn-primary" onClick={handleSalvar} disabled={salvando}>
                  <Plus size={14} />
                  {salvando ? 'Salvando…' : 'Salvar Prédio'}
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
