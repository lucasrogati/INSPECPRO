import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import NotificacoesMenu from './NotificacoesMenu';

export default function TopBar({ title, subtitle, children }) {
  const navigate = useNavigate();
  const [busca, setBusca] = useState('');

  // A busca global procura anomalias (título, descrição, prédio, ambiente…).
  function handleBuscar(e) {
    if (e.key !== 'Enter') return;
    const termo = busca.trim();
    if (!termo) return;
    navigate(`/anomalias?busca=${encodeURIComponent(termo)}`);
    setBusca('');
  }

  return (
    <div
      className="flex items-center justify-between flex-shrink-0 no-print"
      style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '0 28px',
        height: 58,
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <div>
        <h1 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em' }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {children}
        <div className="relative">
          <Search
            size={14}
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
          />
          <input
            type="text"
            placeholder="Buscar anomalias…"
            className="search-input"
            style={{ width: 190 }}
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={handleBuscar}
          />
        </div>
        <NotificacoesMenu />
      </div>
    </div>
  );
}
