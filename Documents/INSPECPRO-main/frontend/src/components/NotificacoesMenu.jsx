import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, AlertTriangle, Eye, Wrench, UserCheck, Clock, CheckCircle2 } from 'lucide-react';
import notificacaoService from '../services/notificacaoService';

const INTERVALO_ATUALIZACAO_MS = 60000;

const TIPO_CONFIG = {
  vencida: { icon: Clock, cor: '#b91c1c', bg: '#fef2f2' },
  critica: { icon: AlertTriangle, cor: '#b91c1c', bg: '#fef2f2' },
  verificacao: { icon: Eye, cor: '#7e22ce', bg: '#faf5ff' },
  atribuida: { icon: UserCheck, cor: '#1d4ed8', bg: '#eff6ff' },
  manutencao: { icon: Wrench, cor: '#d97706', bg: '#fffbeb' },
};

export default function NotificacoesMenu() {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [aberto, setAberto] = useState(false);
  const [dados, setDados] = useState({ total: 0, itens: [] });
  const [erro, setErro] = useState(false);

  const carregar = useCallback(async () => {
    try {
      setDados(await notificacaoService.listar());
      setErro(false);
    } catch {
      setErro(true);
    }
  }, []);

  // Carrega ao montar e atualiza periodicamente (e sempre que o menu é aberto).
  useEffect(() => {
    carregar();
    const t = setInterval(carregar, INTERVALO_ATUALIZACAO_MS);
    return () => clearInterval(t);
  }, [carregar]);

  useEffect(() => {
    if (aberto) carregar();
  }, [aberto, carregar]);

  // Fecha ao clicar fora ou pressionar Esc.
  useEffect(() => {
    if (!aberto) return undefined;
    function aoClicar(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setAberto(false);
    }
    function aoTeclar(e) {
      if (e.key === 'Escape') setAberto(false);
    }
    document.addEventListener('mousedown', aoClicar);
    document.addEventListener('keydown', aoTeclar);
    return () => {
      document.removeEventListener('mousedown', aoClicar);
      document.removeEventListener('keydown', aoTeclar);
    };
  }, [aberto]);

  function abrirItem(item) {
    setAberto(false);
    navigate(item.link);
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setAberto((v) => !v)}
        title="Notificações"
        aria-label={`Notificações${dados.total ? ` (${dados.total})` : ''}`}
        style={{
          position: 'relative',
          background: aberto ? '#f8fafc' : 'none',
          border: '1px solid #e2e8f0',
          borderRadius: 6,
          width: 36,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#64748b',
        }}
      >
        <Bell size={16} />
        {dados.total > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -5,
              right: -5,
              minWidth: 17,
              height: 17,
              padding: '0 4px',
              background: '#dc2626',
              color: '#fff',
              borderRadius: 99,
              border: '1.5px solid #fff',
              fontSize: 10,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxSizing: 'border-box',
            }}
          >
            {dados.total > 9 ? '9+' : dados.total}
          </span>
        )}
      </button>

      {aberto && (
        <div
          className="card"
          style={{
            position: 'absolute',
            right: 0,
            top: 44,
            width: 380,
            maxWidth: '92vw',
            zIndex: 30,
            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.14)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>Notificações</div>
            <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 1 }}>
              {dados.total === 0 ? 'Nenhum alerta no momento' : `${dados.total} ${dados.total === 1 ? 'alerta' : 'alertas'} que precisam de atenção`}
            </div>
          </div>

          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {erro && (
              <div style={{ padding: 16, fontSize: 12.5, color: '#b91c1c' }}>Não foi possível carregar as notificações.</div>
            )}

            {!erro && dados.itens.length === 0 && (
              <div className="flex flex-col items-center" style={{ padding: '28px 16px', color: '#94a3b8', fontSize: 13 }}>
                <CheckCircle2 size={26} color="#22c55e" style={{ marginBottom: 8 }} />
                Tudo em dia por aqui.
              </div>
            )}

            {dados.itens.map((item) => {
              const cfg = TIPO_CONFIG[item.tipo] || TIPO_CONFIG.atribuida;
              const Icon = cfg.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => abrirItem(item)}
                  className="flex items-start gap-3"
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    borderBottom: '1px solid #f1f5f9',
                    padding: '11px 16px',
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                >
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 7,
                      background: cfg.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={15} color={cfg.cor} strokeWidth={1.9} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a', lineHeight: 1.35 }}>{item.titulo}</div>
                    <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 2 }}>{item.descricao}</div>
                  </div>
                </button>
              );
            })}

            {dados.total > dados.itens.length && (
              <div style={{ padding: '10px 16px', fontSize: 11.5, color: '#94a3b8', textAlign: 'center' }}>
                Mostrando os {dados.itens.length} mais importantes
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
