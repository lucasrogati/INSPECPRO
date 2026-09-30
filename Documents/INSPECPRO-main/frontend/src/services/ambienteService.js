import api from './api';

async function listarPorPredio(predioId) {
  const { data } = await api.get('/ambientes', { params: { predio_id: predioId } });
  return data;
}

async function criar(ambiente) {
  const { data } = await api.post('/ambientes', ambiente);
  return data;
}

async function atualizar(id, ambiente) {
  const { data } = await api.put(`/ambientes/${id}`, ambiente);
  return data;
}

async function remover(id) {
  const { data } = await api.delete(`/ambientes/${id}`);
  return data;
}

export default { listarPorPredio, criar, atualizar, remover };
