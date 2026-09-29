import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, MapPin, Layers, Pencil, Trash2, DoorOpen } from 'lucide-react';
import TopBar from '../components/TopBar';
import predioService from '../services/predioService';
import ambienteService from '../services/ambienteService';

const FORM_INICIAL = { bloco: '', andar: '', nome: '' };

export default function BuildingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [predio, setPredio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(FORM_INICIAL);
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    setLoading(true);
    try {
      const data = await predioService.obter(id);
      setPredio(data);
    } catch (err) {
      setErro(err.response?.data?.message || 'Não foi possível carregar o prédio.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function abrirNovo() {
    setEditandoId(null);
    setForm(FORM_INICIAL);
    setShowModal(true);
  }

  function abrirEdicao(ambiente) {
    setEditandoId(ambiente.id);
    setForm({ bloco: ambiente.bloco || '', andar: ambiente.andar || '', nome: ambiente.nome });
    setShowModal(true);
  }

  async function handleSalvar() {
    if (!form.nome) return;
    setSalvando(true);
    try {
      if (editandoId) {
        await ambienteService.atualizar(editandoId, form);
      } else {
        await ambienteService.criar({ ...form, predio_id: id });
      }
      setShowModal(false);
      carregar();
    } catch (err) {
      setErro(err.response?.data?.message || 'Não foi possível salvar o ambiente.');
    } finally {
      setSalvando(false);
    }
  }

  async function handleRemover(ambienteId) {
    if (!window.confirm('Remover este ambiente? Esta ação não pode ser desfeita.')) return;
    try {
      await ambienteService.remover(ambienteId);
      carregar();
    } catch (err) {
      setErro(err.response?.data?.message || 'Não foi possível remover o ambiente.');
    }
  }

  if (loading) {
    return <div style={{ padding: 32, color: '#64748b', fontSize: 13.5 }}>Carregando…</div>;
  }

  if (!predio) {
    return <div style={{ padding: 32, color: '#64748b', fontSize: 13.5 }}>{erro || 'Prédio não encontrado.'}</div>;
  }

  // Agrupa ambientes por Bloco -> Andar para refletir a hierarquia do enunciado.
  const grupos = predio.ambientes.reduce((acc, amb) => {
    const bloco = amb.bloco || 'Sem bloco definido';
    const andar = amb.andar || 'Sem andar definido';
    acc[bloco] = acc[bloco] || {};
    acc[bloco][andar] = acc[bloco][andar] || [];
    acc[bloco][andar].push(amb);
    return acc;
  }, {});

  return (
    <div className="flex flex-col" style={{ minHeight: '100%' }}>
      <TopBar title={predio.nome} subtitle={predio.endereco}>
        <button className="btn-primary" onClick={abrirNovo}>
          <Plus size={15} strokeWidth={2.5} />
          Novo Ambiente
        </button>
      </TopBar>

      <div style={{ padding: '24px 28px' }}>
        <button
          onClick={() => navigate('/predios')}
          className="btn-ghost"
          style={{ marginBottom: 20 }}
        >
          <ArrowLeft size={14} />
          Voltar para Prédios
        </button>

        {erro && (
          <div style={{ marginBottom: 16, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 7, fontSize: 13, color: '#b91c1c' }}>
            {erro}
          </div>
        )}

        {/* Resumo do prédio */}
        <div className="card" style={{ padding: '20px 24px', marginBottom: 24 }}>
          <div className="flex items-start justify-between">
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                Tipo de edificação
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1d4ed8', background: '#eff6ff', padding: '3px 10px', borderRadius: 5 }}>
                {predio.tipo}
              </span>
            </div>
            <div className="flex items-center gap-1.5" style={{ fontSize: 12.5, color: '#64748b' }}>
              <MapPin size={13} color="#94a3b8" />
              {predio.endereco}
            </div>
          </div>
          {predio.observacoes && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9', fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
              {predio.observacoes}
            </div>
          )}
        </div>

        {/* Ambientes agrupados por bloco/andar */}
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
          Ambientes cadastrados ({predio.ambientes.length})
        </div>

        {predio.ambientes.length === 0 ? (
          <div className="card" style={{ padding: 32, textAlign: 'center', color: '#64748b', fontSize: 13.5 }}>
            Nenhum ambiente cadastrado. Clique em "Novo Ambiente" para adicionar Bloco → Andar → Ambiente.
          </div>
        ) : (
          Object.entries(grupos).map(([bloco, andares]) => (
            <div key={bloco} className="card" style={{ marginBottom: 16, overflow: 'hidden' }}>
              <div className="flex items-center gap-2" style={{ padding: '12px 20px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                <Layers size={14} color="#1a56db" />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{bloco}</span>
              </div>
              {Object.entries(andares).map(([andar, ambientes]) => (
                <div key={andar} style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                    {andar}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {ambientes.map((amb) => (
                      <div
                        key={amb.id}
                        className="flex items-center gap-2"
                        style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '6px 8px 6px 12px' }}
                      >
                        <DoorOpen size={13} color="#64748b" />
                        <span style={{ fontSize: 12.5, color: '#334155', fontWeight: 500 }}>{amb.nome}</span>
                        <button
                          onClick={() => abrirEdicao(amb)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 3, display: 'flex' }}
                          title="Editar"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => handleRemover(amb.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 3, display: 'flex' }}
                          title="Remover"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div style={{ background: '#fff', borderRadius: 10, width: 460 }}>
            <div className="flex items-center justify-between" style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                  {editandoId ? 'Editar Ambiente' : 'Novo Ambiente'}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Hierarquia: Bloco → Andar → Ambiente</div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', borderRadius: 5, padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px 24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Bloco</label>
                  <input
                    type="text"
                    value={form.bloco}
                    onChange={(e) => setForm((p) => ({ ...p, bloco: e.target.value }))}
                    placeholder="Ex: Bloco A"
                    style={modalInputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Andar</label>
                  <input
                    type="text"
                    value={form.andar}
                    onChange={(e) => setForm((p) => ({ ...p, andar: e.target.value }))}
                    placeholder="Ex: 3º andar"
                    style={modalInputStyle}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 5 }}>
                  Nome do ambiente
                </label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
                  placeholder="Ex: Sala de máquinas, Corredor sul…"
                  style={modalInputStyle}
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button className="btn-ghost" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button className="btn-primary" onClick={handleSalvar} disabled={salvando}>
                  <Plus size={14} />
                  {salvando ? 'Salvando…' : 'Salvar Ambiente'}
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
