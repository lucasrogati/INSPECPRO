import api from './api';

async function listar(params = {}) {
  const { data } = await api.get('/usuarios', { params });
  return data;
}

async function criar(usuario) {
  const { data } = await api.post('/usuarios', usuario);
  return data;
}

async function atualizar(id, usuario) {
  const { data } = await api.put(`/usuarios/${id}`, usuario);
  return data;
}

async function remover(id) {
  const { data } = await api.delete(`/usuarios/${id}`);
  return data;
}

export default { listar, criar, atualizar, remover };
