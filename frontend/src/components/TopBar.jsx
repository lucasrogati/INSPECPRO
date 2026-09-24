import { Bell, Search } from 'lucide-react';

export default function TopBar({ title, subtitle, children }) {
  return (
    <div
      className="flex items-center justify-between flex-shrink-0"
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
          <input type="text" placeholder="Buscar…" className="search-input" style={{ width: 180 }} />
        </div>
        <button
          style={{
            position: 'relative',
            background: 'none',
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
          <span
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              width: 7,
              height: 7,
              background: '#dc2626',
              borderRadius: '50%',
              border: '1.5px solid #fff',
            }}
          />
        </button>
      </div>
    </div>
  );
}
