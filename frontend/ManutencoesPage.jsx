import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  MapPin,
  User,
  Calendar,
  Tag,
  ClipboardList,
  Pencil,
  Camera,
  Trash2,
  Wrench,
  Plus,
  Play,
  CheckCircle2,
  XCircle,
  X,
  History,
} from 'lucide-react';
import TopBar from '../components/TopBar';
import AnomaliaFormModal from '../components/AnomaliaFormModal';
import ManutencaoFormModal from '../components/ManutencaoFormModal';
import { PrioridadeBadge, StatusAnomaliaBadge, StatusManutencaoBadge, PrazoTexto } from '../components/Badges';
import anomaliaService from '../services/anomaliaService';
import manutencaoService from '../services/manutencaoService';
import { useAuth } from '../context/AuthContext';
import { PERFIS_GESTAO, PERFIS_EXCLUSAO, PERFIS_FOTOS, STATUS_ANOMALIA_CONFIG } from '../utils/constants';
import { formatarData, formatarDataHora } from '../utils/format';

const tituloSecao = { fontSize: 13, fontWeight: 700, color: '#0f172a' };
const rotuloMeta = { fontSize: 11.5, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 };

export default function AnomaliaDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const inputFotos = useRef(null);

  const [anomalia, setAnomalia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [modalEdicao, setModalEdicao] = useState(false);
  const [modalManutencao, setModalManutencao] = useState({ aberto: false, manutencao: null });
  const [fotoAberta, setFotoAberta] = useState(null);
  const [observacaoVerificacao, setObservacaoVerificacao] = useState('');

  const podeGerir = PERFIS_GESTAO.includes(usuario?.tipo);
  const podeExcluir = PERFIS_EXCLUSAO.includes(usuario?.tipo);
  const podeAnexarFotos = PERFIS_FOTOS.includes(usuario?.tipo);

  async function carregar() {
    try {
      setAnomalia(await anomaliaService.obter(id));
      setErro('');
    } catch (err) {
      setErro(err.response?.data?.message || 'Não foi possível carregar a anomalia.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Executa uma ação da API, exibindo erro e recarregando a tela ao final.
  async function executar(acao, mensagemErro) {
    setOcupado(true);
    try {
      await acao();
      setErro('');
      await carregar();
    } catch (err) {
      setErro(err.response?.data?.message || mensagemErro);
    } finally {
      setOcupado(false);
    }
  }

  function handleStatus(novoStatus) {
    if (novoStatus === anomalia.status) return;
    executar(() => anomaliaService.alterarStatus(anomalia.id, novoStatus), 'Não foi possível alterar o status.');
  }

  async function handleVerificar(aprovada) {
    if (!aprovada && !observacaoVerificacao.trim()) {
      setErro('Informe o motivo da reprovação no campo de observação.');
      return;
    }
    await executar(() => anomaliaService.verificar(anomalia.id, aprovada, observacaoVerificacao.trim()), 'Não foi possível registrar a verificação.');
    setObservacaoVerificacao('');
  }

  function handleEnviarFotos(e) {
    const arquivos = e.target.files;
    if (!arquivos || arquivos.length === 0) return;
    executar(() => anomaliaService.enviarFotos(anomalia.id, arquivos), 'Não foi possível enviar as fotos.').finally(() => {
      if (inputFotos.current) inputFotos.current.value = '';
    });
  }

  function handleRemoverFoto(fotoId) {
    if (!window.confirm('Remover esta foto?')) return;
    setFotoAberta(null);
    executar(() => anomaliaService.removerFoto(anomalia.id, fotoId), 'Não foi possível remover a foto.');
  }

  async function handleExcluir() {
    if (!window.confirm('Excluir esta anomalia? Fotos, histórico e manutenções vinculadas também serão removidos.')) return;
    try {
      await anomaliaService.remover(anomalia.id);
      navigate('/anomalias');
    } catch (err) {
      setErro(err.response?.data?.message || 'Não foi possível excluir a anomalia.');
    }
  }

  function podeAtualizarManutencao(m) {
    return podeGerir || (usuario?.tipo === 'manutencao' && m.responsavel_id === usuario.id);
  }

  function handleStatusManutencao(m, status) {
    executar(() => manutencaoService.alterarStatus(m.id, status), 'Não foi possível atualizar a manutenção.');
  }

  function handleRemoverManutencao(m) {
    if (!window.confirm(`Excluir a manutenção #${m.id}?`)) return;
    executar(() => manutencaoService.remover(m.id), 'Não foi possível excluir a manutenção.');
  }

  if (loading) {
    return <div style={{ padding: 32, color: '#64748b', fontSize: 13.5 }}>Carregando…</div>;
  }
  if (!anomalia) {
    return <div style={{ padding: 32, color: '#64748b', fontSize: 13.5 }}>{erro || 'Anomalia não encontrada.'}</div>;
  }

  const resolvida = anomalia.status === 'resolvido';
  const aguardando = anomalia.status === 'aguardando_verificacao';

  return (
    <div className="flex flex-col" style={{ minHeight: '100%' }}>
      <TopBar title={`Anomalia #${anomalia.id}`} subtitle={`${anomalia.predio_nome} · ${anomalia.ambiente_nome}`}>
        {podeGerir && (
          <button className="btn-ghost" onClick={() => setModalEdicao(true)}>
            <Pencil size={13} />
            Editar
          </button>
        )}
        {podeExcluir && (
          <button className="btn-ghost" style={{ color: '#dc2626' }} onClick={handleExcluir}>
            <Trash2 size={13} />
            Excluir
          </button>
        )}
      </TopBar>

      <div style={{ padding: '24px 28px', maxWidth: 940 }}>
        <button onClick={() => navigate(-1)} className="btn-ghost" style={{ marginBottom: 20 }}>
          <ArrowLeft size={14} />
          Voltar
        </button>

        {erro && (
          <div style={{ marginBottom: 16, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 7, fontSize: 13, color: '#b91c1c' }}>
            {erro}
          </div>
        )}

        {/* Cabeçalho */}
        <div className="card" style={{ padding: '20px 24px', marginBottom: 20 }}>
          <div className="flex items-start justify-between gap-4" style={{ marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>{anomalia.titulo}</div>
              <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
                <PrioridadeBadge prioridade={anomalia.prioridade} />
                <StatusAnomaliaBadge status={anomalia.status} />
                {anomalia.vencida && (
                  <span className="status-badge" style={{ background: '#fef2f2', color: '#b91c1c' }}>
                    Prazo vencido
                  </span>
                )}
              </div>
            </div>

            {podeGerir && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11.5, color: '#94a3b8', marginBottom: 6 }}>{resolvida ? 'Reabrir como' : 'Alterar status'}</div>
                <div className="flex items-center gap-2" style={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {Object.entries(STATUS_ANOMALIA_CONFIG)
                    .filter(([valor]) => valor !== 'resolvido')
                    .map(([valor, cfg]) => (
                      <button
                        key={valor}
                        onClick={() => handleStatus(valor)}
                        disabled={ocupado || valor === anomalia.status}
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          padding: '5px 10px',
                          borderRadius: 5,
                          border: valor === anomalia.status ? `1px solid ${cfg.text}` : '1px solid #e2e8f0',
                          background: valor === anomalia.status ? cfg.bg : '#fff',
                          color: valor === anomalia.status ? cfg.text : '#64748b',
                          cursor: valor === anomalia.status ? 'default' : 'pointer',
                          opacity: ocupado ? 0.6 : 1,
                        }}
                      >
                        {cfg.label}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
            <div>
              <div className="flex items-center gap-1.5" style={rotuloMeta}>
                <Building2 size={12} /> Prédio
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a' }}>{anomalia.predio_nome}</div>
            </div>
            <div>
              <div className="flex items-center gap-1.5" style={rotuloMeta}>
                <MapPin size={12} /> Ambiente
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a' }}>{anomalia.ambiente_nome}</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>{[anomalia.ambiente_bloco, anomalia.ambiente_andar].filter(Boolean).join(' · ') || '—'}</div>
            </div>
            <div>
              <div className="flex items-center gap-1.5" style={rotuloMeta}>
                <ClipboardList size={12} /> Inspeção
              </div>
              <Link to={`/inspecoes/${anomalia.inspecao_id}`} style={{ fontSize: 13.5, fontWeight: 600, color: '#1a56db', textDecoration: 'none' }}>
                #{anomalia.inspecao_id} · {formatarData(anomalia.data_inspecao)}
              </Link>
            </div>
            <div>
              <div className="flex items-center gap-1.5" style={rotuloMeta}>
                <User size={12} /> Responsável
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a' }}>{anomalia.responsavel_nome || '—'}</div>
            </div>
            <div>
              <div className="flex items-center gap-1.5" style={rotuloMeta}>
                <Calendar size={12} /> Prazo
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>
                <PrazoTexto prazo={anomalia.prazo} vencida={anomalia.vencida} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5" style={rotuloMeta}>
                <Tag size={12} /> Categoria
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a' }}>{anomalia.categoria || '—'}</div>
            </div>
          </div>

          <div style={{ paddingTop: 16, marginTop: 16, borderTop: '1px solid #f1f5f9' }}>
            <div style={rotuloMeta}>Descrição</div>
            <div style={{ fontSize: 13.5, color: '#334155', lineHeight: 1.6 }}>{anomalia.descricao || 'Nenhuma descrição informada.'}</div>
            <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 12 }}>
              Registrada em {formatarDataHora(anomalia.created_at)} · Atualizada em {formatarDataHora(anomalia.updated_at)}
            </div>
          </div>
        </div>

        {/* Verificação */}
        {aguardando && podeGerir && (
          <div className="card" style={{ padding: '20px 24px', marginBottom: 20, background: '#faf5ff', border: '1px solid #e9d5ff' }}>
            <div style={{ ...tituloSecao, marginBottom: 4, color: '#6b21a8' }}>Verificação pendente</div>
            <div style={{ fontSize: 12.5, color: '#7e22ce', marginBottom: 12 }}>
              A manutenção foi concluída. Confira o serviço no local: aprove para resolver a anomalia ou reprove para devolvê-la à fila.
            </div>
            <textarea
              rows={2}
              value={observacaoVerificacao}
              onChange={(e) => setObservacaoVerificacao(e.target.value)}
              placeholder="Observação da verificação (obrigatória ao reprovar)…"
              style={{ width: '100%', boxSizing: 'border-box', fontSize: 13.5, border: '1px solid #e2e8f0', borderRadius: 6, padding: '9px 12px', marginBottom: 12, fontFamily: 'Inter, sans-serif', resize: 'vertical' }}
            />
            <div className="flex items-center gap-3">
              <button className="btn-primary" style={{ background: '#15803d' }} disabled={ocupado} onClick={() => handleVerificar(true)}>
                <CheckCircle2 size={14} /> Aprovar e resolver
              </button>
              <button className="btn-ghost" style={{ color: '#b91c1c' }} disabled={ocupado} onClick={() => handleVerificar(false)}>
                <XCircle size={14} /> Reprovar
              </button>
            </div>
          </div>
        )}

        {/* Fotos */}
        <div className="card" style={{ padding: '20px 24px', marginBottom: 20 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
            <div className="flex items-center gap-2" style={tituloSecao}>
              <Camera size={15} color="#64748b" /> Fotos ({anomalia.fotos.length})
            </div>
            {podeAnexarFotos && (
              <>
                <input ref={inputFotos} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={handleEnviarFotos} />
                <button className="btn-ghost" disabled={ocupado} onClick={() => inputFotos.current?.click()}>
                  <Plus size={13} /> Adicionar fotos
                </button>
              </>
            )}
          </div>

          {anomalia.fotos.length === 0 ? (
            <div style={{ fontSize: 13, color: '#94a3b8' }}>Nenhuma foto anexada. Formatos aceitos: JPG, PNG e WEBP (até 5 MB cada).</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
              {anomalia.fotos.map((foto) => (
                <button
                  key={foto.id}
                  onClick={() => setFotoAberta(foto)}
                  style={{ padding: 0, border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', cursor: 'zoom-in', background: '#f8fafc', aspectRatio: '4 / 3' }}
                >
                  <img src={anomaliaService.urlFoto(foto.imagem)} alt="Foto da anomalia" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Manutenções */}
        <div className="card" style={{ padding: '20px 24px', marginBottom: 20 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
            <div className="flex items-center gap-2" style={tituloSecao}>
              <Wrench size={15} color="#64748b" /> Manutenções ({anomalia.manutencoes.length})
            </div>
            {podeGerir && !resolvida && (
              <button className="btn-ghost" onClick={() => setModalManutencao({ aberto: true, manutencao: null })}>
                <Plus size={13} /> Agendar manutenção
              </button>
            )}
          </div>

          {anomalia.manutencoes.length === 0 ? (
            <div style={{ fontSize: 13, color: '#94a3b8' }}>Nenhuma manutenção registrada para esta anomalia.</div>
          ) : (
            <div className="flex flex-col gap-3">
              {anomalia.manutencoes.map((m) => (
                <div key={m.id} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 14px' }}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3" style={{ flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>#{m.id}</span>
                      <StatusManutencaoBadge status={m.status} />
                      <span style={{ fontSize: 12.5, color: '#64748b' }}>{m.responsavel_nome}</span>
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>
                        {formatarData(m.data_inicio)}
                        {m.data_conclusao ? ` → ${formatarData(m.data_conclusao)}` : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {podeAtualizarManutencao(m) && m.status === 'agendada' && (
                        <button className="btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }} disabled={ocupado} onClick={() => handleStatusManutencao(m, 'em_andamento')}>
                          <Play size={11} /> Iniciar
                        </button>
                      )}
                      {podeAtualizarManutencao(m) && m.status !== 'concluida' && (
                        <button className="btn-ghost" style={{ padding: '4px 10px', fontSize: 12, color: '#15803d' }} disabled={ocupado} onClick={() => handleStatusManutencao(m, 'concluida')}>
                          <CheckCircle2 size={11} /> Concluir
                        </button>
                      )}
                      {podeGerir && (
                        <button className="btn-ghost" style={{ padding: '4px 8px' }} title="Editar" onClick={() => setModalManutencao({ aberto: true, manutencao: m })}>
                          <Pencil size={12} />
                        </button>
                      )}
                      {podeExcluir && (
                        <button className="btn-ghost" style={{ padding: '4px 8px', color: '#dc2626' }} title="Excluir" onClick={() => handleRemoverManutencao(m)}>
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                  {m.descricao && <div style={{ fontSize: 13, color: '#475569', marginTop: 8, lineHeight: 1.5 }}>{m.descricao}</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Histórico */}
        <div className="card" style={{ padding: '20px 24px' }}>
          <div className="flex items-center gap-2" style={{ ...tituloSecao, marginBottom: 16 }}>
            <History size={15} color="#64748b" /> Histórico
          </div>
          {anomalia.historico.length === 0 ? (
            <div style={{ fontSize: 13, color: '#94a3b8' }}>Sem registros.</div>
          ) : (
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 5, top: 6, bottom: 6, width: 2, background: '#e2e8f0' }} />
              {anomalia.historico.map((h) => {
                const cfg = STATUS_ANOMALIA_CONFIG[h.status_novo];
                const mudouStatus = h.status_anterior !== h.status_novo;
                return (
                  <div key={h.id} className="flex gap-3" style={{ marginBottom: 16, position: 'relative' }}>
                    <span className="timeline-dot filled" style={{ color: cfg?.cor || '#94a3b8', marginTop: 4 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, color: '#0f172a' }}>{h.descricao || 'Atualização registrada.'}</div>
                      <div className="flex items-center gap-2" style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 3, flexWrap: 'wrap' }}>
                        <span>{h.usuario_nome}</span>
                        <span>·</span>
                        <span>{formatarDataHora(h.data)}</span>
                        {mudouStatus && cfg && (
                          <>
                            <span>·</span>
                            <span style={{ color: cfg.text, fontWeight: 600 }}>
                              {STATUS_ANOMALIA_CONFIG[h.status_anterior]?.label ? `${STATUS_ANOMALIA_CONFIG[h.status_anterior].label} → ` : ''}
                              {cfg.label}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Visualização ampliada da foto */}
      {fotoAberta && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setFotoAberta(null);
          }}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <img src={anomaliaService.urlFoto(fotoAberta.imagem)} alt="Foto ampliada" style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: 8, display: 'block' }} />
            <div className="flex items-center justify-between" style={{ marginTop: 10, color: '#e2e8f0', fontSize: 12.5 }}>
              <span>Enviada em {formatarDataHora(fotoAberta.data)}</span>
              {podeGerir && (
                <button className="btn-ghost" style={{ color: '#fca5a5', borderColor: '#7f1d1d', background: 'transparent' }} onClick={() => handleRemoverFoto(fotoAberta.id)}>
                  <Trash2 size={13} /> Remover foto
                </button>
              )}
            </div>
            <button onClick={() => setFotoAberta(null)} style={{ position: 'absolute', top: -12, right: -12, background: '#fff', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {modalEdicao && (
        <AnomaliaFormModal
          anomalia={anomalia}
          onClose={() => setModalEdicao(false)}
          onSalvo={() => {
            setModalEdicao(false);
            carregar();
          }}
        />
      )}

      {modalManutencao.aberto && (
        <ManutencaoFormModal
          anomalia={anomalia}
          manutencao={modalManutencao.manutencao}
          onClose={() => setModalManutencao({ aberto: false, manutencao: null })}
          onSalvo={() => {
            setModalManutencao({ aberto: false, manutencao: null });
            carregar();
          }}
        />
      )}
    </div>
  );
}
