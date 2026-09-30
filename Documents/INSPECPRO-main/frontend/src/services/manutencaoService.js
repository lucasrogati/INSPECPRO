import api from './api';

async function listar(params = {}) {
  const { data } = await api.get('/manutencoes', { params });
  return data;
}

async function obter(id) {
  const { data } = await api.get(`/manutencoes/${id}`);
  return data;
}

async function criar(manutencao) {
  const { data } = await api.post('/manutencoes', manutencao);
  return data;
}

async function atualizar(id, manutencao) {
  const { data } = await api.put(`/manutencoes/${id}`, manutencao);
  return data;
}

async function alterarStatus(id, status, observacao) {
  const { data } = await api.patch(`/manutencoes/${id}/status`, { status, observacao });
  return data;
}

async function remover(id) {
  const { data } = await api.delete(`/manutencoes/${id}`);
  return data;
}

export default { listar, obter, criar, atualizar, alterarStatus, remover };
