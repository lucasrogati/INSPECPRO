import api from './api';

async function listar(params = {}) {
  const { data } = await api.get('/inspecoes', { params });
  return data;
}

async function obter(id) {
  const { data } = await api.get(`/inspecoes/${id}`);
  return data;
}

async function criar(inspecao) {
  const { data } = await api.post('/inspecoes', inspecao);
  return data;
}

async function atualizar(id, inspecao) {
  const { data } = await api.put(`/inspecoes/${id}`, inspecao);
  return data;
}

async function alterarStatus(id, status) {
  const { data } = await api.patch(`/inspecoes/${id}/status`, { status });
  return data;
}

async function remover(id) {
  const { data } = await api.delete(`/inspecoes/${id}`);
  return data;
}

export default { listar, obter, criar, atualizar, alterarStatus, remover };
