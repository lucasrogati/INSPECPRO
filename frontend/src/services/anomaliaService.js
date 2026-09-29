import api from './api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
// As fotos são servidas pelo Express em /uploads (fora do prefixo /api).
const FILES_URL = API_URL.replace(/\/api\/?$/, '');

async function listar(params = {}) {
  const { data } = await api.get('/anomalias', { params });
  return data;
}

async function listarResponsaveis() {
  const { data } = await api.get('/anomalias/responsaveis');
  return data;
}

async function obter(id) {
  const { data } = await api.get(`/anomalias/${id}`);
  return data;
}

async function criar(anomalia) {
  const { data } = await api.post('/anomalias', anomalia);
  return data;
}

async function atualizar(id, anomalia) {
  const { data } = await api.put(`/anomalias/${id}`, anomalia);
  return data;
}

async function alterarStatus(id, status, observacao) {
  const { data } = await api.patch(`/anomalias/${id}/status`, { status, observacao });
  return data;
}

async function verificar(id, aprovada, observacao) {
  const { data } = await api.post(`/anomalias/${id}/verificar`, { aprovada, observacao });
  return data;
}

async function remover(id) {
  const { data } = await api.delete(`/anomalias/${id}`);
  return data;
}

async function enviarFotos(id, arquivos) {
  const formData = new FormData();
  Array.from(arquivos).forEach((arquivo) => formData.append('fotos', arquivo));
  const { data } = await api.post(`/anomalias/${id}/fotos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

async function removerFoto(id, fotoId) {
  const { data } = await api.delete(`/anomalias/${id}/fotos/${fotoId}`);
  return data;
}

function urlFoto(imagem) {
  return `${FILES_URL}${imagem}`;
}

export default {
  listar,
  listarResponsaveis,
  obter,
  criar,
  atualizar,
  alterarStatus,
  verificar,
  remover,
  enviarFotos,
  removerFoto,
  urlFoto,
};
