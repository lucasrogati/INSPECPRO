import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, Eye, EyeOff, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const destino = location.state?.from?.pathname || '/dashboard';

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      await login(email, senha);
      navigate(destino, { replace: true });
    } catch (err) {
      setErro(err.response?.data?.message || 'Não foi possível entrar. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full">
      {/* Painel de marca */}
      <div
        className="flex flex-col justify-between"
        style={{
          width: 460,
          background: '#0d1b2e',
          padding: '48px 52px',
          flexShrink: 0,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <svg style={{ position: 'absolute', inset: 0, opacity: 0.04 }} width="100%" height="100%">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ffffff" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        <div
          style={{
            position: 'absolute',
            bottom: -80,
            right: -80,
            width: 320,
            height: 320,
            borderRadius: '50%',
            background: 'rgba(26,86,219,0.12)',
            filter: 'blur(40px)',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="flex items-center gap-3" style={{ marginBottom: 48 }}>
            <div
              style={{
                width: 40,
                height: 40,
                background: '#1a56db',
                borderRadius: 9,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldCheck size={22} color="#fff" strokeWidth={2} />
            </div>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.03em' }}>
              InspecPro
            </span>
          </div>

          <h2 style={{ fontSize: 32, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: 14 }}>
            Gestão completa de inspeções prediais
          </h2>
          <p style={{ fontSize: 14.5, color: '#64748b', lineHeight: 1.65, maxWidth: 320 }}>
            Acompanhe o ciclo de vida completo das anomalias — da identificação à resolução — com
            rastreabilidade total.
          </p>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          {[
            { icon: Building2, text: 'Gestão multi-edificação com hierarquia Prédio → Bloco → Andar' },
            { icon: ShieldCheck, text: 'Rastreabilidade completa de anomalias e manutenções' },
            { icon: ShieldCheck, text: 'Laudos e relatórios técnicos em PDF' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3" style={{ marginBottom: 16 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  background: 'rgba(26,86,219,0.2)',
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                <item.icon size={14} color="#60a5fa" strokeWidth={2} />
              </div>
              <span style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>{item.text}</span>
            </div>
          ))}

          <div
            style={{
              marginTop: 32,
              padding: '14px 18px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
            }}
          >
            <div style={{ fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 6 }}>
              Versão
            </div>
            <div style={{ fontSize: 13, color: '#64748b' }}>InspecPro v1.0.0 &nbsp;·&nbsp; Fase 1</div>
          </div>
        </div>
      </div>

      {/* Formulário */}
      <div className="flex-1 flex items-center justify-center" style={{ background: '#f8fafc', padding: 40 }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ marginBottom: 36 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: 6 }}>
              Acessar plataforma
            </h1>
            <p style={{ fontSize: 14, color: '#64748b' }}>Informe suas credenciais para continuar</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                E-mail corporativo
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@empresa.com.br"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#1a56db')}
                onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                Senha
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  style={{ ...inputStyle, padding: '10px 40px 10px 13px' }}
                  onFocus={(e) => (e.target.style.borderColor = '#1a56db')}
                  onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {erro && (
              <div
                style={{
                  marginBottom: 16,
                  padding: '10px 13px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 7,
                  fontSize: 13,
                  color: '#b91c1c',
                }}
              >
                {erro}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px 0', fontSize: 14.5, marginTop: 6 }}>
              {loading ? 'Autenticando…' : 'Entrar'}
            </button>
          </form>

          <div style={{ marginTop: 28, padding: '13px 16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 7 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              Acesso demonstração (após rodar o seed)
            </div>
            <div style={{ fontSize: 12.5, color: '#64748b' }}>
              <span className="font-mono" style={{ fontSize: 12 }}>
                carlos.oliveira@inspecpro.com.br &nbsp;/&nbsp; Admin@123
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  fontSize: 14,
  color: '#0f172a',
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 7,
  padding: '10px 13px',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
};
