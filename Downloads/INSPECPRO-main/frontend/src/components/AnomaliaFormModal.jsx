import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal, { Campo, MensagemErro, inputStyle, selectStyle } from './Modal';
import anomaliaService from '../services/anomaliaService';
import inspecaoService from '../services/inspecaoService';
import ambienteService from '../services/ambienteService';
import { PRIORIDADE_CONFIG, CATEGORIAS_SUGERIDAS } from '../utils/constants';
import { formatarData, rotuloAmbiente, toInputDate } from '../utils/format';

/**
 * Criação/edição de anomalia.
 *  - anomalia: objeto existente (modo edição) ou null (nova)
 *  - inspecao: quando informada, a anomalia é criada dentro dela (sem escolher a inspeção)
 */
export default function AnomaliaFormModal({ anomalia = null, inspecao = null, onClose, onSalvo }) {
  const editando = Boolean(anomalia);

  const [inspecoes, setInspecoes] = useState([]);
  const [ambientes, setAmbientes] = useState([]);
  const [responsaveis, setResponsaveis] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const [form, setForm] = useState({
    inspecao_id: inspecao?.id ?? anomalia?.inspecao_id ?? '',
    ambiente_id: anomalia?.ambiente_id ?? '',
    titulo: anomalia?.titulo ?? '',
    categoria: anomalia?.categoria ?? '',
    descricao: anomalia?.descricao ?? '',
    prioridade: anomalia?.prioridade ?? 'media',
    responsavel_id: anomalia?.responsavel_id ?? '',
    prazo: toInputDate(anomalia?.prazo),
  });

  const escolherInspecao = !inspecao && !editando;
  const inspecaoSelecionada = inspecao || inspecoes.find((i) => String(i.id) === String(form.inspecao_id));
  const predioId = inspecao?.predio_id ?? anomalia?.predio_id ?? inspecaoSelecionada?.predio_id;

  useEffect(() => {
    anomaliaService.listarResponsaveis().then(setResponsaveis).catch(() => {});
    if (escolherInspecao) {
      inspecaoService.listar().then(setInspecoes).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!predioId) {
      setAmbientes([]);
      return;
    }
    ambienteService.listarPorPredio(predioId).then(setAmbientes).catch(() => setAmbientes([]));
  }, [predioId]);

  function set(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function handleSalvar() {
    if (!form.inspecao_id || !form.ambiente_id || !form.titulo.trim()) {
      setErro('Inspeção, ambiente e título são obrigatórios.');
      return;
    }
    setSalvando(true);
    setErro('');
    try {
      const { inspecao_id, ...dadosEditaveis } = form;
      const resultado = editando
        ? await anomaliaService.atualizar(anomalia.id, dadosEditaveis)
        : await anomaliaService.criar(form);
      onSalvo(resultado);
    } catch (err) {
      setErro(err.response?.data?.message || 'Não foi possível salvar a anomalia.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal
      titulo={editando ? `Editar Anomalia #${anomalia.id}` : 'Nova Anomalia'}
      subtitulo={inspecao ? `Inspeção #${inspecao.id} · ${inspecao.predio_nome}` : 'Registre o problema encontrado'}
      onClose={onClose}
      largura={580}
    >
      <MensagemErro>{erro}</MensagemErro>

      {escolherInspecao && (
        <Campo label="Inspeção">
          <select
            className="filter-select"
            style={selectStyle}
            value={form.inspecao_id}
            onChange={(e) => setForm((f) => ({ ...f, inspecao_id: e.target.value, ambiente_id: '' }))}
          >
            <option value="">Selecione a inspeção</option>
            {inspecoes.map((i) => (
              <option key={i.id} value={i.id}>
                #{i.id} · {i.predio_nome} · {formatarData(i.data_inspecao)}
              </option>
            ))}
          </select>
        </Campo>
      )}

      <Campo label="Ambiente">
        <select
          className="filter-select"
          style={selectStyle}
          value={form.ambiente_id}
          onChange={(e) => set('ambiente_id', e.target.value)}
          disabled={!predioId}
        >
          <option value="">{predioId ? 'Selecione o ambiente' : 'Escolha a inspeção primeiro'}</option>
          {ambientes.map((a) => (
            <option key={a.id} value={a.id}>
              {rotuloAmbiente(a)}
            </option>
          ))}
        </select>
        {predioId && ambientes.length === 0 && (
          <div style={{ fontSize: 11.5, color: '#b45309', marginTop: 5 }}>
            Este prédio ainda não tem ambientes cadastrados. Cadastre em Prédios → Detalhes.
          </div>
        )}
      </Campo>

      <Campo label="Título">
        <input
          type="text"
          value={form.titulo}
          onChange={(e) => set('titulo', e.target.value)}
          placeholder="Ex.: Infiltração na parede do corredor"
          style={inputStyle}
          maxLength={180}
        />
      </Campo>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Campo label="Categoria">
          <input
            type="text"
            list="categorias-anomalia"
            value={form.categoria}
            onChange={(e) => set('categoria', e.target.value)}
            placeholder="Ex.: Hidráulica"
            style={inputStyle}
            maxLength={80}
          />
          <datalist id="categorias-anomalia">
            {CATEGORIAS_SUGERIDAS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Campo>
        <Campo label="Prioridade">
          <select className="filter-select" style={selectStyle} value={form.prioridade} onChange={(e) => set('prioridade', e.target.value)}>
            {Object.entries(PRIORIDADE_CONFIG).map(([valor, cfg]) => (
              <option key={valor} value={valor}>
                {cfg.label}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Campo label="Responsável">
          <select className="filter-select" style={selectStyle} value={form.responsavel_id} onChange={(e) => set('responsavel_id', e.target.value)}>
            <option value="">Sem responsável</option>
            {responsaveis.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nome}
              </option>
            ))}
          </select>
        </Campo>
        <Campo label="Prazo">
          <input type="date" value={form.prazo} onChange={(e) => set('prazo', e.target.value)} style={inputStyle} />
        </Campo>
      </div>

      <Campo label="Descrição" style={{ marginBottom: 20 }}>
        <textarea
          rows={3}
          value={form.descricao}
          onChange={(e) => set('descricao', e.target.value)}
          placeholder="Detalhes, extensão do problema, riscos…"
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </Campo>

      <div className="flex items-center justify-end gap-3">
        <button className="btn-ghost" onClick={onClose}>
          Cancelar
        </button>
        <button className="btn-primary" onClick={handleSalvar} disabled={salvando}>
          <AlertTriangle size={14} />
          {salvando ? 'Salvando…' : editando ? 'Salvar Alterações' : 'Registrar Anomalia'}
        </button>
      </div>
    </Modal>
  );
}
