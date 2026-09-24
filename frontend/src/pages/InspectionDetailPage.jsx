import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  User,
  Calendar,
  Clock,
  Loader2,
  CheckCircle2,
  Mail,
  MapPin,
  AlertTriangle,
} from 'lucide-react';
import TopBar from '../components/TopBar';
import inspecaoService from '../services/inspecaoService';
import { useAuth } from '../context/AuthContext';

const STATUS_CONFIG = {
  planejada: { label: 'Planejada', bg: '#f1f5f9', text: '#475569', icon: Clock },
  em_andamento: { label: 'Em Andamento', bg: '#fffbeb', text: '#d97706', icon: Loader2 },
  concluida: { label: 'Concluída', bg: '#f0fdf4', text: '#15803d', icon: CheckCircle2 },
};

function formatarData(valor) {
  if (!valor) return '—';
  const [ano, mes, dia] = String(valor).slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
}

function formatarDataHora(valor) {
  if (!valor) return '—';
  return new Date(valor).toLocaleString('pt-BR');
}

export default function InspectionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [inspecao, setInspecao] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [alterandoStatus, setAlterandoStatus] = useState(false);

  const podeAlterarStatus = ['administrador', 'gestor', 'engenheiro'].includes(usuario?.tipo);

  async function carregar() {
    setLoading(true);
    try {
      const data = await inspecaoService.obter(id);
      setInspecao(data);
      setErro('');
    } catch (err) {
      setErro(err.response?.data?.message || 'Não foi possível carregar a inspeção.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleAlterarStatus(novoStatus) {
    if (!inspecao || novoStatus === inspecao.status) return;
    setAlterandoStatus(true);
    try {
      const atualizada = await inspecaoService.alterarStatus(inspecao.id, novoStatus);
      setInspecao(atualizada);
    } catch (err) {
      setErro(err.response?.data?.message || 'Não foi possível alterar o status.');
    } finally {
      setAlterandoStatus(false);
    }
  }

  if (loading) {
    return <div style={{ padding: 32, color: '#64748b', fontSize: 13.5 }}>Carregando…</div>;
  }

  if (!inspecao) {
    return <div style={{ padding: 32, color: '#64748b', fontSize: 13.5 }}>{erro || 'Inspeção não encontrada.'}</div>;
  }

  const cfg = STATUS_CONFIG[inspecao.status] || STATUS_CONFIG.planejada;
  const Icon = cfg.icon;

  return (
    <div className="flex flex-col" style={{ minHeight: '100%' }}>
      <TopBar title={`Inspeção #${inspecao.id}`} subtitle={inspecao.predio_nome} />

      <div style={{ padding: '24px 28px', maxWidth: 860 }}>
        <button onClick={() => navigate('/inspecoes')} className="btn-ghost" style={{ marginBottom: 20 }}>
          <ArrowLeft size={14} />
          Voltar para Inspeções
        </button>

        {erro && (
          <div style={{ marginBottom: 16, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 7, fontSize: 13, color: '#b91c1c' }}>
            {erro}
          </div>
        )}

        {/* Cabeçalho com status */}
        <div className="card" style={{ padding: '20px 24px', marginBottom: 20 }}>
          <div className="flex items-start justify-between" style={{ marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                Status atual
              </div>
              <span className="status-badge" style={{ background: cfg.bg, color: cfg.text, fontSize: 13 }}>
                <Icon size={13} />
                {cfg.label}
              </span>
            </div>

            {podeAlterarStatus && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11.5, color: '#94a3b8', marginBottom: 6 }}>Alterar status</div>
                <div className="flex items-center gap-2">
                  {Object.entries(STATUS_CONFIG).map(([valor, c]) => (
                    <button
                      key={valor}
                      onClick={() => handleAlterarStatus(valor)}
                      disabled={alterandoStatus || valor === inspecao.status}
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        padding: '5px 10px',
                        borderRadius: 5,
                        border: valor === inspecao.status ? `1px solid ${c.text}` : '1px solid #e2e8f0',
                        background: valor === inspecao.status ? c.bg : '#fff',
                        color: valor === inspecao.status ? c.text : '#64748b',
                        cursor: valor === inspecao.status ? 'default' : 'pointer',
                        opacity: alterandoStatus ? 0.6 : 1,
                      }}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
            <div>
              <div className="flex items-center gap-1.5" style={{ fontSize: 11.5, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                <Building2 size={12} />
                Prédio
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{inspecao.predio_nome}</div>
              <div className="flex items-center gap-1.5" style={{ fontSize: 12.5, color: '#64748b' }}>
                <MapPin size={11} color="#94a3b8" />
                {inspecao.predio_endereco}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5" style={{ fontSize: 11.5, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                <User size={12} />
                Responsável
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{inspecao.responsavel_nome}</div>
              <div className="flex items-center gap-1.5" style={{ fontSize: 12.5, color: '#64748b' }}>
                <Mail size={11} color="#94a3b8" />
                {inspecao.responsavel_email}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, paddingTop: 16, marginTop: 16, borderTop: '1px solid #f1f5f9' }}>
            <div>
              <div className="flex items-center gap-1.5" style={{ fontSize: 11.5, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                <Calendar size={12} />
                Data da inspeção
              </div>
              <div style={{ fontSize: 13.5, color: '#334155', fontWeight: 600 }}>{formatarData(inspecao.data_inspecao)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                Última atualização
              </div>
              <div style={{ fontSize: 13.5, color: '#334155', fontWeight: 600 }}>{formatarDataHora(inspecao.updated_at)}</div>
            </div>
          </div>
        </div>

        {/* Observações */}
        <div className="card" style={{ padding: '20px 24px', marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>Observações</div>
          <div style={{ fontSize: 13.5, color: '#334155', lineHeight: 1.6 }}>
            {inspecao.observacoes || 'Nenhuma observação registrada para esta inspeção.'}
          </div>
        </div>

        {/* Aviso sobre próxima fase */}
        <div className="card flex items-start gap-3" style={{ padding: '16px 20px', background: '#f8fafc' }}>
          <AlertTriangle size={16} color="#94a3b8" style={{ marginTop: 1, flexShrink: 0 }} />
          <div style={{ fontSize: 12.5, color: '#64748b', lineHeight: 1.5 }}>
            As anomalias identificadas nesta inspeção serão registradas e listadas aqui a partir da <strong>Fase 4</strong>.
          </div>
        </div>
      </div>
    </div>
  );
}
