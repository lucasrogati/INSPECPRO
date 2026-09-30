import api from './api';

async function listar() {
  const { data } = await api.get('/notificacoes');
  return data;
}

export default { listar };
