import api from './api';

async function sistema() {
  const { data } = await api.get('/configuracoes/sistema');
  return data;
}

export default { sistema };
