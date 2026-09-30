import { useAuth } from '../context/AuthContext';

export default function RoleRoute({ tiposPermitidos, children }) {
  const { usuario } = useAuth();

  if (!tiposPermitidos.includes(usuario?.tipo)) {
    return (
      <div style={{ padding: 32 }}>
        <div className="card" style={{ padding: 24, fontSize: 13.5, color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca' }}>
          Você não tem permissão para acessar esta área.
        </div>
      </div>
    );
  }

  return children;
}
