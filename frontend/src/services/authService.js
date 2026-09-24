import api from './api';

async function login(email, senha) {
  const { data } = await api.post('/auth/login', { email, senha });
  localStorage.setItem('inspecpro_token', data.token);
  localStorage.setItem('inspecpro_usuario', JSON.stringify(data.usuario));
  return data.usuario;
}

async function me() {
  const { data } = await api.get('/auth/me');
  return data.usuario;
}

function logout() {
  localStorage.removeItem('inspecpro_token');
  localStorage.removeItem('inspecpro_usuario');
}

function getUsuarioLocal() {
  const raw = localStorage.getItem('inspecpro_usuario');
  return raw ? JSON.parse(raw) : null;
}

function getToken() {
  return localStorage.getItem('inspecpro_token');
}

export default { login, me, logout, getUsuarioLocal, getToken };
