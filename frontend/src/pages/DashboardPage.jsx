import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { usuario } = useAuth();

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
        Bem-vindo, {usuario?.nome?.split(' ')[0]} 👋
      </h1>
      <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>
        Fase 1 concluída: estrutura do projeto, banco de dados e autenticação prontos.
      </p>
      <div className="card" style={{ padding: 20, fontSize: 13.5, color: '#334155' }}>
        O dashboard com estatísticas, KPIs e gráficos será implementado na <strong>Fase 6</strong>.
      </div>
    </div>
  );
}
