import { useEffect, useState } from 'react';
import { Wrench } from 'lucide-react';
import Modal, { Campo, MensagemErro, inputStyle, selectStyle } from './Modal';
import anomaliaService from '../services/anomaliaService';
import manutencaoService from '../services/manutencaoService';
import { STATUS_MANUTENCAO_CONFIG } from '../utils/constants';
import { toInputDate } from '../utils/format';

/**
 * Agendamento/edição de manutenção.
 *  - manutencao: objeto existente (edição) ou null (nova)
 *  - anomalia: quando informada, a manutenção é criada para ela (sem escolher a anomalia)
 */
export default function ManutencaoFormModal({ manutencao = null, anomalia = null, onClose, onSalvo }) {
  const editando = Boolean(manutencao);

  const [anomalias, setAnomalias] = useState([]);
  const [responsaveis, setResponsaveis] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const [form, setForm] = useState({
    anomalia_id: anomalia?.id ?? manutencao?.anomalia_id ?? '',
    responsavel_id: manutencao?.responsavel_id ?? anomalia?.responsavel_id ?? '',
    descricao: manutencao?.descricao ?? '',
    data_inicio: toInputDate(manutencao?.data_inicio),
    data_conclusao: toInputDate(manutencao?.data_conclusao),
    status: manutencao?.status ?? 'agendada',
  });

  const escolherAnomalia = !anomalia && !editando;

  useEffect(() => {
    anomaliaService.listarResponsaveis().then(setResponsaveis).catch(() => {});
    if (escolherAnomalia) {
      anomaliaService.listar({ abertas: true }).then(setAnomalias).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function set(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  // Ao escolher a anomalia, sugere o responsável dela (se ainda não houver um escolhido).
  function escolherAnomaliaId(id) {
    const a = anomalias.find((x) => String(x.id) === String(id));
    setForm((f) => ({ ...f, anomalia_id: id, responsavel_id: f.responsavel_id || a?.responsavel_id || '' }));
  }

  async function handleSalvar() {
    if (!form.anomalia_id || !form.responsavel_id) {
      setErro('Anomalia e responsável são obrigatórios.');
      return;
    }
    if (form.data_inicio && form.data_conclusao && form.data_conclusao < form.data_inicio) {
      setErro('A data de conclusão não pode ser anterior à data de início.');
      return;
    }
    setSalvando(true);
    setErro('');
    try {
      const { anomalia_id, ...dadosEditaveis } = form;
      const resultado = editando
        ? await manutencaoService.atualizar(manutencao.id, dadosEditaveis)
        : await manutencaoService.criar(form);
      onSalvo(resultado);
    } catch (err) {
      setErro(err.response?.data?.message || 'Não foi possível salvar a manutenção.');
    } finally {
      setSalvando(false);
    }
  }

  const tituloAnomalia = anomalia?.titulo ?? manutencao?.anomalia_titulo;

  return (
    <Modal
      titulo={editando ? `Editar Manutenção #${manutencao.id}` : 'Agendar Manutenção'}
      subtitulo={tituloAnomalia ? `Anomalia: ${tituloAnomalia}` : 'Vincule a manutenção a uma anomalia'}
      onClose={onClose}
    >
      <MensagemErro>{erro}</MensagemErro>

      {escolherAnomalia && (
        <Campo label="Anomalia">
          <select className="filter-select" style={selectStyle} value={form.anomalia_id} onChange={(e) => escolherAnomaliaId(e.target.value)}>
            <option value="">Selecione a anomalia</option>
            {anomalias.map((a) => (
              <option key={a.id} value={a.id}>
                #{a.id} · {a.titulo} — {a.predio_nome} / {a.ambiente_nome}
              </option>
            ))}
          </select>
        </Campo>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Campo label="Responsável">
          <select className="filter-select" style={selectStyle} value={form.responsavel_id} onChange={(e) => set('responsavel_id', e.target.value)}>
            <option value="">Selecione</option>
            {responsaveis.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nome}
              </option>
            ))}
          </select>
        </Campo>
        <Campo label="Status">
          <select className="filter-select" style={selectStyle} value={form.status} onChange={(e) => set('status', e.target.value)}>
            {Object.entries(STATUS_MANUTENCAO_CONFIG).map(([valor, cfg]) => (
              <option key={valor} value={valor}>
                {cfg.label}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Campo label="Data de início">
          <input type="date" value={form.data_inicio} onChange={(e) => set('data_inicio', e.target.value)} style={inputStyle} />
        </Campo>
        <Campo label="Data de conclusão">
          <input
            type="date"
            value={form.data_conclusao}
            onChange={(e) => set('data_conclusao', e.target.value)}
            style={inputStyle}
            disabled={form.status !== 'concluida'}
          />
        </Campo>
      </div>

      <Campo label="Descrição do serviço" style={{ marginBottom: 20 }}>
        <textarea
          rows={3}
          value={form.descricao}
          onChange={(e) => set('descricao', e.target.value)}
          placeholder="O que será (ou foi) executado, materiais, fornecedor…"
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </Campo>

      <div className="flex items-center justify-end gap-3">
        <button className="btn-ghost" onClick={onClose}>
          Cancelar
        </button>
        <button className="btn-primary" onClick={handleSalvar} disabled={salvando}>
          <Wrench size={14} />
          {salvando ? 'Salvando…' : editando ? 'Salvar Alterações' : 'Agendar Manutenção'}
        </button>
      </div>
    </Modal>
  );
}
