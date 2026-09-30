import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  AlertTriangle,
  Wrench,
  FileText,
  Users,
  Settings,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/predios', label: 'Prédios', icon: Building2 },
  { to: '/inspecoes', label: 'Inspeções', icon: ClipboardList },
  { to: '/anomalias', label: 'Anomalias', icon: AlertTriangle },
  { to: '/manutencoes', label: 'Manutenções', icon: Wrench },
  { to: '/relatorios', label: 'Relatórios', icon: FileText },
  { to: '/usuarios', label: 'Usuários', icon: Users },
];

const TIPO_LABEL = {
  administrador: 'Administrador',
  engenheiro: 'Engenheiro/Inspetor',
  manutencao: 'Resp. Manutenção',
  gestor: 'Gestor/Síndico',
};

function getIniciais(nome = '') {
  const partes = nome.trim().split(' ');
  const primeira = partes[0]?.[0] || '';
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (primeira + ultima).toUpperCase();
}

export default function Sidebar() {
  const { usuario, logout } = useAuth();

  return (
    <aside
      className="flex flex-col flex-shrink-0"
      style={{
        width: 228,
        minHeight: '100%',
        background: '#0d1b2e',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Logo */}
      <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2.5">
          <div
            style={{
              width: 34,
              height: 34,
              background: '#1a56db',
              borderRadius: 7,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={18} color="#fff" strokeWidth={2} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              InspecPro
            </div>
            <div style={{ fontSize: 10.5, color: '#475569', marginTop: 1, fontWeight: 500 }}>
              Gestão de Inspeções
            </div>
          </div>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1" style={{ padding: '12px 10px', overflowY: 'auto' }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: '#334155',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            padding: '4px 8px 8px',
          }}
        >
          Navegação
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
            >
              <Icon size={16} strokeWidth={1.8} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
            </NavLink>
          );
        })}

        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '12px 8px' }} />

        <NavLink to="/configuracoes" className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}>
          <Settings size={16} strokeWidth={1.8} style={{ flexShrink: 0 }} />
          Configurações
        </NavLink>
      </nav>

      {/* Usuário logado */}
      <div style={{ padding: '14px 10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2.5" style={{ padding: '6px 10px' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#1a56db',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 700,
              color: '#fff',
              flexShrink: 0,
            }}
          >
            {getIniciais(usuario?.nome)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: '#e2e8f0',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {usuario?.nome}
            </div>
            <div style={{ fontSize: 11, color: '#475569' }}>{TIPO_LABEL[usuario?.tipo] || usuario?.tipo}</div>
          </div>
          <button
            onClick={logout}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 4, borderRadius: 4 }}
            title="Sair"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
