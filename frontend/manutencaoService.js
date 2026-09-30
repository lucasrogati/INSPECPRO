import api from './api';

async function anomalias(params = {}) {
  const { data } = await api.get('/relatorios/anomalias', { params });
  return data;
}

async function manutencoes(params = {}) {
  const { data } = await api.get('/relatorios/manutencoes', { params });
  return data;
}

// tipo: 'anomalias' | 'manutencoes'. Retorna um Blob com o CSV para download.
async function baixarCsv(tipo, params = {}) {
  const { data } = await api.get(`/relatorios/${tipo}`, {
    params: { ...params, formato: 'csv' },
    responseType: 'blob',
  });
  return data;
}

export default { anomalias, manutencoes, baixarCsv };
