import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Printer, Filter, FileText } from 'lucide-react';
import TopBar from '../components/TopBar';
import { PrioridadeBadge, StatusAnomaliaBadge, StatusManutencaoBadge, PrazoTexto } from '../components/Badges';
import relatorioService from '../services/relatorioService';
import predioService from '../services/predioService';
import anomaliaService from '../services/anomaliaService';
import { PRIORIDADE_CONFIG, STATUS_ANOMALIA_CONFIG, STATUS_MANUTENCAO_CONFIG } from '../utils/constants';
import { formatarData, baixarArquivo } from '../utils/format';

const FILTROS_INICIAL = { predio_id: '', status: '', prioridade: '', responsavel_id: '', data_inicio: '', data_fim: '' };

function limparParametros(filtros) {
  return Object.fromEntries(Object.entries(filtros).filter(([, v]) => v !== ''));
}

function Chip({ rotulo, valor, cor = '#0f172a' }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 16px' }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: cor, lineHeight: 1.1 }}>{valor}</div>
      <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>{rotulo}</div>
    </div>
  );
}

export default function RelatoriosPage() {
  const [tipo, setTipo] = useState('anomalias');
  const [filtros, setFiltros] = useState(FILTROS_INICIAL);
  const [relatorio, setRelatorio] = useState(null);
  const [predios, setPredios] = useState([]);
  const [responsaveis, setResponsaveis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportando, setExportando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    predioService.listar().then(setPredios).catch(() => {});
    anomaliaService.listarResponsaveis().then(setResponsaveis).catch(() => {});
  }, []);

  useEffect(() => {
    async function carregar() {
      setLoading(true);
      try {
        const params = limparParametros(filtros);
        setRelatorio(tipo === 'anomalias' ? await relatorioService.anomalias(params) : await relatorioService.manutencoes(params));
        setErro('');
      } catch (err) {
        setErro(err.response?.data?.message || 'Não foi possível gerar o relatório.');
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, [tipo, filtros]);

  function trocarTipo(novo) {
    if (novo === tipo) return;
    setRelatorio(null);
    setTipo(novo);
    // Status e prioridade têm valores diferentes em cada relatório.
    setFiltros((f) => ({ ...f, status: '', prioridade: '' }));
  }

  async function handleExportar() {
    setExportando(true);
    try {
      const blob = await relatorioService.baixarCsv(tipo, limparParametros(filtros));
      baixarArquivo(blob, `relatorio-${tipo}-${new Date().toISOString().slice(0, 10)}.csv`);
    } catch (err) {
      setErro(err.response?.data?.message || 'Não foi possível exportar o CSV.');
    } finally {
      setExportando(false);
    }
  }

  const statusOpcoes = tipo === 'anomalias' ? STATUS_ANOMALIA_CONFIG : STATUS_MANUTENCAO_CONFIG;
  const resumo = relatorio?.resumo;
  const itens = relatorio?.itens || [];
  const nomePredio = predios.find((p) => String(p.id) === String(filtros.predio_id))?.nome;

  return (
    <div className="flex flex-col" style={{ minHeight: '100%' }}>
      <TopBar title="Relatórios" subtitle="Consulte, exporte e imprima os dados do sistema">
        <button className="btn-ghost" onClick={() => window.print()} disabled={loading || itens.length === 0}>
          <Printer size={14} />
          Imprimir / PDF
        </button>
        <button className="btn-primary" onClick={handleExportar} disabled={exportando || loading || itens.length === 0}>
          <Download size={14} />
          {exportando ? 'Exportando…' : 'Exportar CSV'}
        </button>
      </TopBar>

      <div style={{ padding: '24px 28px' }}>
        {/* Cabeçalho visível apenas na impressão */}
        <div className="print-only" style={{ display: 'none', marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>InspecPro — Relatório de {tipo === 'anomalias' ? 'Anomalias' : 'Manutenções'}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            Gerado em {new Date().toLocaleString('pt-BR')}
            {nomePredio ? ` · Prédio: ${nomePredio}` : ''}
            {filtros.data_inicio ? ` · De ${formatarData(filtros.data_inicio)}` : ''}
            {filtros.data_fim ? ` até ${formatarData(filtros.data_fim)}` : ''}
          </div>
        </div>

        {erro && (
          <div style={{ marginBottom: 16, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 7, fontSize: 13, color: '#b91c1c' }}>
            {erro}
          </div>
        )}

        <div className="no-print flex items-center gap-2" style={{ marginBottom: 16 }}>
          {[
            ['anomalias', 'Anomalias'],
            ['manutencoes', 'Manutenções'],
          ].map(([valor, rotulo]) => (
            <button
              key={valor}
              onClick={() => trocarTipo(valor)}
              style={{
                fontSize: 13,
                fontWeight: 600,
                padding: '7px 16px',
                borderRadius: 6,
                cursor: 'pointer',
                border: tipo === valor ? '1px solid #1a56db' : '1px solid #e2e8f0',
                background: tipo === valor ? '#eff6ff' : '#fff',
                color: tipo === valor ? '#1a56db' : '#64748b',
              }}
            >
              {rotulo}
            </button>
          ))}
        </div>

        <div className="card no-print flex items-center gap-3" style={{ padding: '12px 16px', marginBottom: 20, flexWrap: 'wrap' }}>
          <div className="flex items-center gap-1.5" style={{ fontSize: 12.5, fontWeight: 600, color: '#64748b' }}>
            <Filter size={13} />
            Filtros:
          </div>

          <select className="filter-select" value={filtros.predio_id} onChange={(e) => setFiltros((f) => ({ ...f, predio_id: e.target.value }))}>
            <option value="">Todos os prédios</option>
            {predios.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>

          <select className="filter-select" value={filtros.status} onChange={(e) => setFiltros((f) => ({ ...f, status: e.target.value }))}>
            <option value="">Todos os status</option>
            {Object.entries(statusOpcoes).map(([valor, cfg]) => (
              <option key={valor} value={valor}>
                {cfg.label}
              </option>
            ))}
          </select>

          {tipo === 'anomalias' && (
            <select className="filter-select" value={filtros.prioridade} onChange={(e) => setFiltros((f) => ({ ...f, prioridade: e.target.value }))}>
              <option value="">Todas as prioridades</option>
              {Object.entries(PRIORIDADE_CONFIG).map(([valor, cfg]) => (
                <option key={valor} value={valor}>
                  {cfg.label}
                </option>
              ))}
            </select>
          )}

          <select className="filter-select" value={filtros.responsavel_id} onChange={(e) => setFiltros((f) => ({ ...f, responsavel_id: e.target.value }))}>
            <option value="">Todos os responsáveis</option>
            {responsaveis.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nome}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1.5" style={{ fontSize: 12.5, color: '#64748b' }}>
            {tipo === 'anomalias' ? 'Registro de' : 'Início de'}
            <input type="date" className="filter-select" style={{ cursor: 'text' }} value={filtros.data_inicio} onChange={(e) => setFiltros((f) => ({ ...f, data_inicio: e.target.value }))} />
            até
            <input type="date" className="filter-select" style={{ cursor: 'text' }} value={filtros.data_fim} onChange={(e) => setFiltros((f) => ({ ...f, data_fim: e.target.value }))} />
          </div>

          {Object.values(filtros).some(Boolean) && (
            <button className="btn-ghost" style={{ padding: '6px 12px', fontSize: 12.5 }} onClick={() => setFiltros(FILTROS_INICIAL)}>
              Limpar filtros
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ color: '#64748b', fontSize: 13.5 }}>Gerando relatório…</div>
        ) : (
          resumo && (
            <>
              <div className="flex items-center gap-3" style={{ marginBottom: 20, flexWrap: 'wrap' }}>
                <Chip rotulo="Total no relatório" valor={resumo.total} />
                {tipo === 'anomalias' ? (
                  <>
                    <Chip rotulo="Em aberto" valor={resumo.abertas} cor="#c2410c" />
                    <Chip rotulo="Prazo vencido" valor={resumo.vencidas} cor="#b91c1c" />
                    <Chip rotulo="Críticas" valor={resumo.por_prioridade.critica || 0} cor="#b91c1c" />
                    <Chip rotulo="Resolvidas" valor={resumo.por_status.resolvido || 0} cor="#15803d" />
                  </>
                ) : (
                  <>
                    <Chip rotulo="Agendadas" valor={resumo.por_status.agendada || 0} />
                    <Chip rotulo="Em andamento" valor={resumo.por_status.em_andamento || 0} cor="#d97706" />
                    <Chip rotulo="Concluídas" valor={resumo.por_status.concluida || 0} cor="#15803d" />
                    <Chip rotulo="Duração média" valor={resumo.duracao_media_dias !== null ? `${resumo.duracao_media_dias} d` : '—'} />
                  </>
                )}
              </div>

              {itens.length === 0 ? (
                <div className="card" style={{ padding: 32, textAlign: 'center', color: '#64748b', fontSize: 13.5 }}>
                  <FileText size={22} color="#cbd5e1" style={{ marginBottom: 8 }} />
                  <div>Nenhum registro encontrado com os filtros atuais.</div>
                </div>
              ) : tipo === 'anomalias' ? (
                <div className="card" style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Anomalia</th>
                        <th>Local</th>
                        <th>Prioridade</th>
                        <th>Status</th>
                        <th>Responsável</th>
                        <th>Prazo</th>
                        <th>Registrada</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itens.map((a) => (
                        <tr key={a.id}>
                          <td style={{ color: '#94a3b8' }}>{a.id}</td>
                          <td>
                            <Link to={`/anomalias/${a.id}`} style={{ fontWeight: 600, color: '#0f172a', textDecoration: 'none' }}>
                              {a.titulo}
                            </Link>
                            <div style={{ fontSize: 11.5, color: '#94a3b8' }}>{a.categoria || 'Sem categoria'}</div>
                          </td>
                          <td>
                            {a.predio_nome}
                            <div style={{ fontSize: 11.5, color: '#94a3b8' }}>{[a.ambiente_bloco, a.ambiente_andar, a.ambiente_nome].filter(Boolean).join(' · ')}</div>
                          </td>
                          <td>
                            <PrioridadeBadge prioridade={a.prioridade} />
                          </td>
                          <td>
                            <StatusAnomaliaBadge status={a.status} />
                          </td>
                          <td>{a.responsavel_nome || '—'}</td>
                          <td>
                            <PrazoTexto prazo={a.prazo} vencida={a.vencida} />
                          </td>
                          <td>{formatarData(a.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="card" style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Anomalia</th>
                        <th>Local</th>
                        <th>Responsável</th>
                        <th>Status</th>
                        <th>Início</th>
                        <th>Conclusão</th>
                        <th>Duração</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itens.map((m) => (
                        <tr key={m.id}>
                          <td style={{ color: '#94a3b8' }}>{m.id}</td>
                          <td>
                            <Link to={`/anomalias/${m.anomalia_id}`} style={{ fontWeight: 600, color: '#0f172a', textDecoration: 'none' }}>
                              {m.anomalia_titulo}
                            </Link>
                            {m.descricao && <div style={{ fontSize: 11.5, color: '#94a3b8' }}>{m.descricao}</div>}
                          </td>
                          <td>
                            {m.predio_nome}
                            <div style={{ fontSize: 11.5, color: '#94a3b8' }}>{m.ambiente_nome}</div>
                          </td>
                          <td>{m.responsavel_nome}</td>
                          <td>
                            <StatusManutencaoBadge status={m.status} />
                          </td>
                          <td>{formatarData(m.data_inicio)}</td>
                          <td>{formatarData(m.data_conclusao)}</td>
                          <td>{m.duracao_dias !== null ? `${m.duracao_dias} d` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )
        )}
      </div>
    </div>
  );
}
