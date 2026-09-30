export default function EmDesenvolvimento({ titulo, fase }) {
  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>{titulo}</h1>
      <div className="card" style={{ padding: 20, fontSize: 13.5, color: '#64748b', marginTop: 16 }}>
        Esta tela será implementada na <strong>{fase}</strong>.
      </div>
    </div>
  );
}
