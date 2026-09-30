import api from './api';

async function listar(params = {}) {
  const { data } = await api.get('/predios', { params });
  return data;
}

async function obter(id) {
  const { data } = await api.get(`/predios/${id}`);
  return data;
}

async function criar(predio) {
  const { data } = await api.post('/predios', predio);
  return data;
}

async function atualizar(id, predio) {
  const { data } = await api.put(`/predios/${id}`, predio);
  return data;
}

async function remover(id) {
  const { data } = await api.delete(`/predios/${id}`);
  return data;
}

export default { listar, obter, criar, atualizar, remover };
