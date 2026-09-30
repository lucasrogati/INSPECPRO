import api from './api';

async function obter(params = {}) {
  const { data } = await api.get('/dashboard', { params });
  return data;
}

export default { obter };
