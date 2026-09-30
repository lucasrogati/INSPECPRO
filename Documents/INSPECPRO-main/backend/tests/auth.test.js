const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { iniciar, encerrar, criarUsuario, requisicao } = require('./helpers');

let admin;
before(async () => {
  await iniciar();
  admin = await criarUsuario('administrador', 'admin');
});
after(encerrar);

test('login com credenciais válidas retorna token e usuário', async () => {
  const { status, body } = await requisicao('POST', '/auth/login', { corpo: { email: admin.email, senha: admin.senha } });
  assert.equal(status, 200);
  assert.ok(body.token);
  assert.equal(body.usuario.tipo, 'administrador');
  assert.equal(body.usuario.senha, undefined, 'a senha nunca deve ser retornada');
});

test('login com senha errada ou e-mail inexistente retorna 401 com a mesma mensagem', async () => {
  const errada = await requisicao('POST', '/auth/login', { corpo: { email: admin.email, senha: 'x' } });
  const inexistente = await requisicao('POST', '/auth/login', { corpo: { email: 'nao@existe.com', senha: 'x' } });
  assert.equal(errada.status, 401);
  assert.equal(inexistente.status, 401);
  assert.equal(errada.body.message, inexistente.body.message, 'não deve revelar se o e-mail existe');
});

test('rotas protegidas exigem token válido', async () => {
  assert.equal((await requisicao('GET', '/anomalias')).status, 401);
  assert.equal((await requisicao('GET', '/anomalias', { token: 'token-invalido' })).status, 401);
});

test('usuário inativo não consegue logar nem usar token antigo', async () => {
  const u = await criarUsuario('gestor', 'inativo');
  await requisicao('DELETE', `/usuarios/${u.id}`, { token: admin.token });
  const login = await requisicao('POST', '/auth/login', { corpo: { email: u.email, senha: u.senha } });
  assert.equal(login.status, 403);
  assert.equal((await requisicao('GET', '/auth/me', { token: u.token })).status, 401);
});

test('perfil: valida campos, impede e-mail duplicado e atualiza os dados', async () => {
  const u = await criarUsuario('engenheiro', 'perfil');
  const t = u.token;
  assert.equal((await requisicao('PUT', '/auth/perfil', { token: t, corpo: { nome: '', email: 'a@b.com' } })).status, 400);
  assert.equal((await requisicao('PUT', '/auth/perfil', { token: t, corpo: { nome: 'X', email: 'invalido' } })).status, 400);
  assert.equal((await requisicao('PUT', '/auth/perfil', { token: t, corpo: { nome: 'X', email: admin.email } })).status, 409);
  const ok = await requisicao('PUT', '/auth/perfil', { token: t, corpo: { nome: 'Novo Nome', email: u.email } });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.usuario.nome, 'Novo Nome');
  assert.equal(ok.body.usuario.tipo, 'engenheiro', 'o perfil de acesso não muda por aqui');
});

test('senha: exige a atual, mínimo de 6 caracteres e passa a valer no login', async () => {
  const u = await criarUsuario('gestor', 'senha');
  const t = u.token;
  assert.equal((await requisicao('PUT', '/auth/senha', { token: t, corpo: { senha_atual: 'errada', nova_senha: 'Nova@123' } })).status, 400);
  assert.equal((await requisicao('PUT', '/auth/senha', { token: t, corpo: { senha_atual: u.senha, nova_senha: '123' } })).status, 400);
  assert.equal((await requisicao('PUT', '/auth/senha', { token: t, corpo: { senha_atual: u.senha, nova_senha: u.senha } })).status, 400);
  assert.equal((await requisicao('PUT', '/auth/senha', { token: t, corpo: { senha_atual: u.senha, nova_senha: 'Nova@123' } })).status, 200);
  assert.equal((await requisicao('POST', '/auth/login', { corpo: { email: u.email, senha: u.senha } })).status, 401);
  assert.equal((await requisicao('POST', '/auth/login', { corpo: { email: u.email, senha: 'Nova@123' } })).status, 200);
});

test('gestão de usuários é restrita ao administrador', async () => {
  const g = await criarUsuario('gestor', 'semacesso');
  assert.equal((await requisicao('GET', '/usuarios', { token: g.token })).status, 403);
  assert.equal((await requisicao('GET', '/configuracoes/sistema', { token: g.token })).status, 403);
  assert.equal((await requisicao('GET', '/configuracoes/sistema', { token: admin.token })).status, 200);
});

test('respostas trazem cabeçalhos de segurança (helmet)', async () => {
  const r = await requisicao('GET', '/health');
  assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(r.headers.get('x-powered-by'), null, 'não deve anunciar o Express');
});

test('CORS libera apenas a origem configurada', async () => {
  const boa = await requisicao('GET', '/health', { headers: { Origin: 'http://localhost:5173' } });
  const ruim = await requisicao('GET', '/health', { headers: { Origin: 'http://site-malicioso.com' } });
  assert.equal(boa.headers.get('access-control-allow-origin'), 'http://localhost:5173');
  assert.equal(ruim.headers.get('access-control-allow-origin'), null);
});
