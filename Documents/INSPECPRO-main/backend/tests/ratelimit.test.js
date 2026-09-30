// Arquivo separado: o limite é lido quando o módulo carrega, então precisa ser definido ANTES do helpers.
process.env.LOGIN_RATE_MAX = '3';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { iniciar, encerrar, criarUsuario, requisicao } = require('./helpers');

let usuario;
before(async () => {
  await iniciar();
  usuario = await criarUsuario('gestor', 'rate');
});
after(encerrar);

test('bloqueia o login (429) após exceder as tentativas malsucedidas', async () => {
  for (let i = 0; i < 3; i += 1) {
    const r = await requisicao('POST', '/auth/login', { corpo: { email: usuario.email, senha: 'errada' } });
    assert.equal(r.status, 401);
  }
  const bloqueada = await requisicao('POST', '/auth/login', { corpo: { email: usuario.email, senha: 'errada' } });
  assert.equal(bloqueada.status, 429);
  assert.match(bloqueada.body.message, /Muitas tentativas/);

  // Mesmo a senha correta fica bloqueada enquanto durar a janela.
  const correta = await requisicao('POST', '/auth/login', { corpo: { email: usuario.email, senha: usuario.senha } });
  assert.equal(correta.status, 429);
});
