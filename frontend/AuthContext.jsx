import { useEffect, useState } from 'react';
import { Plus, Shield, HardHat, Wrench, Building2, X } from 'lucide-react';
import TopBar from '../components/TopBar';
import usuarioService from '../services/usuarioService';

const ROLE_CONFIG = {
  administrador: { label: 'Administrador', icon: Shield, color: '#7c3aed', bg: '#f5f3ff', desc: 'Acesso total ao sistema' },
  engenheiro: { label: 'Engenheiro/Inspetor', icon: HardHat, color: '#1d4ed8', bg: '#eff6ff', desc: 'Inspeções e anomalias' },
  manutencao: { label: 'Resp. Manutenção', icon: Wrench, color: '#d97706', bg: '#fffbeb', desc: 'Execução e evidências' },
  gestor: { label: 'Gestor/Síndico', icon: Building2, color: '#0891b2', bg: '#ecfeff', desc: 'Acompanhamento e relatórios' },
};

const AVATAR_COLORS = ['#1a56db', '#7c3aed', '#0891b2', '#d97706', '#dc2626', '#15803d', '#475569', '#c2410c'];

const FORM_INICIAL = { nome: '', email: '', senha: '', tipo: 'engenheiro' };

function iniciais(nome = '') {
  return nome.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

export default function UsersPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(FORM_INICIAL);
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    setLoading(true);
    try {
      const data = await usuarioService.listar();
      setUsuarios(data);
    } catch (err) {
      setErro(err.response?.data?.message || 'Não foi possível carregar os usuários.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  function abrirNovo() {
    setEditandoId(null);
    setForm(FORM_INICIAL);
    setShowModal(true);
  }

  function abrirEdicao(usuario) {
    setEditandoId(usuario.id);
    setForm({ nome: usuario.nome, email: usuario.email, senha: '', tipo: usuario.tipo });
    setShowModal(true);
  }

  async function handleSalvar() {
    if (!form.nome || !form.email || (!editandoId && !form.senha)) return;
    setSalvando(true);
    try {
      if (editandoId) {
        const payload = { nome: form.nome, email: form.email, tipo: form.tipo };
        if (form.senha) payload.senha = form.senha;
        await usuarioService.atualizar(editandoId, payload);
      } else {
        await usuarioService.criar(form);
      }
      setShowModal(false);
      carregar();
    } catch (err) {
      setErro(err.response?.data?.message || 'Não foi possível salvar o usuário.');
    } finally {
      setSalvando(false);
    }
  }

  async function handleInativar(usuario) {
    if (!window.confirm(`Inativar o acesso de ${usuario.nome}?`)) return;
    try {
      await usuarioService.remover(usuario.id);
      carregar();
    } catch (err) {
      setErro(err.response?.data?.message || 'Não foi possível inativar o usuário.');
    }
  }

  const tipos = Object.keys(ROLE_CONFIG);

  return (
    <div className="flex flex-col" style={{ minHeight: '100%' }}>
      <TopBar title="Usuários" subtitle={`${usuarios.length} usuários cadastrados`}>
        <button className="btn-primary" onClick={abrirNovo}>
          <Plus size={15} strokeWidth={2.5} />
          Novo Usuário
        </button>
      </TopBar>

      <div style={{ padding: '24px 28px' }}>
        {erro && (
          <div style={{ marginBottom: 16, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 7, fontSize: 13, color: '#b91c1c' }}>
            {erro}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
          {tipos.map((tipo) => {
            const cfg = ROLE_CONFIG[tipo];
            const Icon = cfg.icon;
            const count = usuarios.filter((u) => u.tipo === tipo).length;
            return (
              <div key={tipo} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '18px 20px' }}>
                <div className="flex items-center gap-3" style={{ marginBottom: 10 }}>
                  <div style={{ width: 36, height: 36, background: cfg.bg, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={18} color={cfg.color} strokeWidth={1.8} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>{cfg.label}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{cfg.desc}</div>
                  </div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: cfg.color, letterSpacing: '-0.03em' }}>{count}</div>
              </div>
            );
          })}
        </div>

        <div className="card">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Todos os Usuários</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Gerencie perfis e permissões de acesso</div>
          </div>

          {loading ? (
            <div style={{ padding: 24, color: '#64748b', fontSize: 13.5 }}>Carregando…</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>E-mail</th>
                  <th>Perfil</th>
                  <th>Status</th>
                  <th style={{ width: 140 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((user, i) => {
                  const cfg = ROLE_CONFIG[user.tipo];
                  const Icon = cfg.icon;
                  const avatarColor = AVATAR_COLORS[i % AVATAR_COLORS.length];
                  return (
                    <tr key={user.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div
                            style={{
                              width: 34, height: 34, borderRadius: '50%', background: avatarColor,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
                            }}
                          >
                            {iniciais(user.nome)}
                          </div>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a' }}>{user.nome}</div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: 12, color: '#334155', fontFamily: 'JetBrains Mono, monospace' }}>{user.email}</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div style={{ width: 22, height: 22, background: cfg.bg, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icon size={12} color={cfg.color} strokeWidth={2} />
                          </div>
                          <span style={{ fontSize: 12.5, fontWeight: 600, color: cfg.color }}>{cfg.label}</span>
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600,
                            padding: '3px 9px', borderRadius: 99,
                            background: user.ativo ? '#f0fdf4' : '#f8fafc',
                            color: user.ativo ? '#15803d' : '#94a3b8',
                          }}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: user.ativo ? '#22c55e' : '#cbd5e1' }} />
                          {user.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button onClick={() => abrirEdicao(user)} style={acaoBtnStyle}>
                            Editar
                          </button>
                          {user.ativo && (
                            <button onClick={() => handleInativar(user)} style={{ ...acaoBtnStyle, color: '#dc2626' }}>
                              Inativar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
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
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{editandoId ? 'Editar Usuário' : 'Novo Usuário'}</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Preencha os dados de acesso</div>
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
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Nome completo</label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
                  placeholder="Ex: Ana Souza"
                  style={modalInputStyle}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 5 }}>E-mail</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="nome@empresa.com.br"
                  style={modalInputStyle}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 5 }}>
                  {editandoId ? 'Nova senha (deixe em branco para manter)' : 'Senha'}
                </label>
                <input
                  type="password"
                  value={form.senha}
                  onChange={(e) => setForm((p) => ({ ...p, senha: e.target.value }))}
                  placeholder="Mínimo 6 caracteres"
                  style={modalInputStyle}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Perfil de acesso</label>
                <select
                  className="filter-select"
                  style={{ width: '100%', padding: '9px 28px 9px 12px' }}
                  value={form.tipo}
                  onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value }))}
                >
                  {tipos.map((t) => (
                    <option key={t} value={t}>
                      {ROLE_CONFIG[t].label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button className="btn-ghost" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button className="btn-primary" onClick={handleSalvar} disabled={salvando}>
                  <Plus size={14} />
                  {salvando ? 'Salvando…' : 'Salvar Usuário'}
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
  fontSize: 12,
  color: '#1a56db',
  background: 'none',
  border: '1px solid #e2e8f0',
  borderRadius: 5,
  padding: '5px 10px',
  cursor: 'pointer',
  fontFamily: 'Inter, sans-serif',
  fontWeight: 500,
};
