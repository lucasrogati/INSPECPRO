import { useEffect, useState } from 'react';
import { User, Lock, Server, Check, Shield, HardHat, Wrench, Building2 } from 'lucide-react';
import TopBar from '../components/TopBar';
import { Campo, MensagemErro, inputStyle } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';
import configuracaoService from '../services/configuracaoService';

const PERFIL_CONFIG = {
  administrador: { label: 'Administrador', icon: Shield, color: '#7c3aed', bg: '#f5f3ff', desc: 'Acesso total ao sistema' },
  engenheiro: { label: 'Engenheiro/Inspetor', icon: HardHat, color: '#1d4ed8', bg: '#eff6ff', desc: 'Inspeções e anomalias' },
  manutencao: { label: 'Resp. Manutenção', icon: Wrench, color: '#d97706', bg: '#fffbeb', desc: 'Execução e evidências' },
  gestor: { label: 'Gestor/Síndico', icon: Building2, color: '#0891b2', bg: '#ecfeff', desc: 'Acompanhamento e relatórios' },
};

function MensagemSucesso({ children }) {
  if (!children) return null;
  return (
    <div
      className="flex items-center gap-2"
      style={{ marginBottom: 16, padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 7, fontSize: 13, color: '#15803d' }}
    >
      <Check size={15} />
      {children}
    </div>
  );
}

function CartaoSecao({ titulo, descricao, children }) {
  return (
    <div className="card" style={{ maxWidth: 640 }}>
      <div style={{ padding: '16px 22px', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{titulo}</div>
        {descricao && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{descricao}</div>}
      </div>
      <div style={{ padding: '20px 22px' }}>{children}</div>
    </div>
  );
}

function AbaPerfil() {
  const { usuario, atualizarPerfil } = useAuth();
  const [form, setForm] = useState({ nome: usuario?.nome || '', email: usuario?.email || '' });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const cfg = PERFIL_CONFIG[usuario?.tipo] || PERFIL_CONFIG.gestor;
  const Icon = cfg.icon;
  const alterado = form.nome.trim() !== usuario?.nome || form.email.trim() !== usuario?.email;

  async function handleSalvar() {
    setErro('');
    setSucesso('');
    if (!form.nome.trim() || !form.email.trim()) {
      setErro('Nome e e-mail são obrigatórios.');
      return;
    }
    setSalvando(true);
    try {
      const atualizado = await atualizarPerfil({ nome: form.nome.trim(), email: form.email.trim() });
      setForm({ nome: atualizado.nome, email: atualizado.email });
      setSucesso('Perfil atualizado com sucesso.');
    } catch (err) {
      setErro(err.response?.data?.message || 'Não foi possível atualizar o perfil.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <CartaoSecao titulo="Meu perfil" descricao="Seus dados de identificação no sistema">
      <MensagemErro>{erro}</MensagemErro>
      <MensagemSucesso>{sucesso}</MensagemSucesso>

      <Campo label="Nome completo">
        <input style={inputStyle} value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
      </Campo>
      <Campo label="E-mail">
        <input type="email" style={inputStyle} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      </Campo>

      <Campo label="Perfil de acesso">
        <div className="flex items-center gap-3" style={{ padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6 }}>
          <div style={{ width: 32, height: 32, background: cfg.bg, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={16} color={cfg.color} strokeWidth={1.8} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{cfg.label}</div>
            <div style={{ fontSize: 11.5, color: '#94a3b8' }}>{cfg.desc} · alterado somente por um administrador</div>
          </div>
        </div>
      </Campo>

      <div className="flex justify-end" style={{ marginTop: 4 }}>
        <button className="btn-primary" onClick={handleSalvar} disabled={salvando || !alterado}>
          {salvando ? 'Salvando…' : 'Salvar alterações'}
        </button>
      </div>
    </CartaoSecao>
  );
}

const SENHA_INICIAL = { atual: '', nova: '', confirmacao: '' };

function AbaSeguranca() {
  const [form, setForm] = useState(SENHA_INICIAL);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  async function handleSalvar() {
    setErro('');
    setSucesso('');
    if (!form.atual || !form.nova || !form.confirmacao) {
      setErro('Preencha todos os campos.');
      return;
    }
    if (form.nova.length < 6) {
      setErro('A nova senha deve ter ao menos 6 caracteres.');
      return;
    }
    if (form.nova !== form.confirmacao) {
      setErro('A confirmação não confere com a nova senha.');
      return;
    }
    setSalvando(true);
    try {
      await authService.alterarSenha(form.atual, form.nova);
      setForm(SENHA_INICIAL);
      setSucesso('Senha alterada com sucesso.');
    } catch (err) {
      setErro(err.response?.data?.message || 'Não foi possível alterar a senha.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <CartaoSecao titulo="Alterar senha" descricao="Use uma senha que você não utiliza em outros serviços">
      <MensagemErro>{erro}</MensagemErro>
      <MensagemSucesso>{sucesso}</MensagemSucesso>

      <Campo label="Senha atual">
        <input type="password" autoComplete="current-password" style={inputStyle} value={form.atual} onChange={(e) => setForm({ ...form, atual: e.target.value })} />
      </Campo>
      <Campo label="Nova senha">
        <input type="password" autoComplete="new-password" style={inputStyle} value={form.nova} onChange={(e) => setForm({ ...form, nova: e.target.value })} />
        <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 4 }}>Mínimo de 6 caracteres.</div>
      </Campo>
      <Campo label="Confirmar nova senha">
        <input
          type="password"
          autoComplete="new-password"
          style={inputStyle}
          value={form.confirmacao}
          onChange={(e) => setForm({ ...form, confirmacao: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && handleSalvar()}
        />
      </Campo>

      <div className="flex justify-end" style={{ marginTop: 4 }}>
        <button className="btn-primary" onClick={handleSalvar} disabled={salvando}>
          {salvando ? 'Alterando…' : 'Alterar senha'}
        </button>
      </div>
    </CartaoSecao>
  );
}

function formatarUptime(segundos) {
  if (segundos < 60) return `${segundos}s`;
  const min = Math.floor(segundos / 60);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h ${min % 60} min`;
  return `${Math.floor(h / 24)} d ${h % 24} h`;
}

const ROTULOS_CONTAGEM = [
  ['usuarios_ativos', 'Usuários ativos'],
  ['predios', 'Prédios'],
  ['ambientes', 'Ambientes'],
  ['inspecoes', 'Inspeções'],
  ['anomalias', 'Anomalias'],
  ['fotos', 'Fotos'],
  ['manutencoes', 'Manutenções'],
  ['usuarios_inativos', 'Usuários inativos'],
];

function AbaSistema() {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    configuracaoService
      .sistema()
      .then(setDados)
      .catch((err) => setErro(err.response?.data?.message || 'Não foi possível carregar as informações do sistema.'));
  }, []);

  if (erro) return <MensagemErro>{erro}</MensagemErro>;
  if (!dados) return <div style={{ color: '#64748b', fontSize: 13.5 }}>Carregando…</div>;

  const linhasAmbiente = [
    ['Versão do Node.js', dados.ambiente.node],
    ['Ambiente', dados.ambiente.ambiente],
    ['Banco de dados', dados.ambiente.banco],
    ['Validade do login (JWT)', dados.ambiente.expiracao_token],
    ['Servidor no ar há', formatarUptime(dados.ambiente.uptime_segundos)],
  ];

  return (
    <div style={{ maxWidth: 820 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {ROTULOS_CONTAGEM.map(([chave, rotulo]) => (
          <div key={chave} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '16px 18px' }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{rotulo}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', marginTop: 4 }}>{dados.contagens[chave]}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ padding: '16px 22px', borderBottom: '1px solid #f1f5f9', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Ambiente de execução</div>
        <table className="data-table">
          <tbody>
            {linhasAmbiente.map(([k, v]) => (
              <tr key={k}>
                <td style={{ color: '#64748b', width: '40%' }}>{k}</td>
                <td className="font-mono" style={{ fontSize: 12.5 }}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ConfiguracoesPage() {
  const { usuario } = useAuth();
  const [aba, setAba] = useState('perfil');

  const abas = [
    { id: 'perfil', label: 'Perfil', icon: User },
    { id: 'seguranca', label: 'Segurança', icon: Lock },
    ...(usuario?.tipo === 'administrador' ? [{ id: 'sistema', label: 'Sistema', icon: Server }] : []),
  ];

  return (
    <div className="flex flex-col" style={{ minHeight: '100%' }}>
      <TopBar title="Configurações" subtitle="Gerencie sua conta e preferências" />

      <div style={{ padding: '24px 28px' }}>
        <div className="flex gap-1" style={{ borderBottom: '1px solid #e2e8f0', marginBottom: 22 }}>
          {abas.map((a) => {
            const Icon = a.icon;
            const ativa = aba === a.id;
            return (
              <button
                key={a.id}
                onClick={() => setAba(a.id)}
                className="flex items-center gap-2"
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: `2px solid ${ativa ? '#1a56db' : 'transparent'}`,
                  marginBottom: -1,
                  padding: '10px 16px',
                  fontSize: 13.5,
                  fontWeight: ativa ? 600 : 500,
                  color: ativa ? '#1a56db' : '#64748b',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                <Icon size={15} strokeWidth={1.9} />
                {a.label}
              </button>
            );
          })}
        </div>

        {aba === 'perfil' && <AbaPerfil />}
        {aba === 'seguranca' && <AbaSeguranca />}
        {aba === 'sistema' && <AbaSistema />}
      </div>
    </div>
  );
}
