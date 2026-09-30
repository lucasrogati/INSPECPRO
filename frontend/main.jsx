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

async function atualizarPerfil(dados) {
  const { data } = await api.put('/auth/perfil', dados);
  localStorage.setItem('inspecpro_usuario', JSON.stringify(data.usuario));
  return data.usuario;
}

async function alterarSenha(senhaAtual, novaSenha) {
  const { data } = await api.put('/auth/senha', { senha_atual: senhaAtual, nova_senha: novaSenha });
  return data;
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

export default { login, me, atualizarPerfil, alterarSenha, logout, getUsuarioLocal, getToken };
