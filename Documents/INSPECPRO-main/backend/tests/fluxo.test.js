const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { iniciar, encerrar, criarUsuario, requisicao, criarCenario } = require('./helpers');

let admin;
let eng;
let tecnico;
let outroTecnico;
let cenario;

before(async () => {
  await iniciar();
  admin = await criarUsuario('administrador', 'admin');
  eng = await criarUsuario('engenheiro', 'eng');
  tecnico = await criarUsuario('manutencao', 'tecnico');
  outroTecnico = await criarUsuario('manutencao', 'outro');
  cenario = await criarCenario(admin.token);
});
after(encerrar);

async function novaAnomalia(extra = {}) {
  const r = await requisicao('POST', '/anomalias', {
    token: eng.token,
    corpo: { inspecao_id: cenario.inspecao.id, ambiente_id: cenario.ambiente.id, titulo: 'Infiltração', prioridade: 'alta', ...extra },
  });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  return r.body;
}

const statusDe = async (id) => (await requisicao('GET', `/anomalias/${id}`, { token: admin.token })).body;

test('anomalia sem responsável nasce "identificado"; com responsável nasce "pendente"', async () => {
  const semResp = await novaAnomalia();
  const comResp = await novaAnomalia({ responsavel_id: tecnico.id });
  assert.equal(semResp.status, 'identificado');
  assert.equal(comResp.status, 'pendente');
});

test('atribuir responsável a uma anomalia "identificado" a torna "pendente"', async () => {
  const a = await novaAnomalia();
  const r = await requisicao('PUT', `/anomalias/${a.id}`, { token: eng.token, corpo: { responsavel_id: tecnico.id } });
  assert.equal(r.status, 200);
  assert.equal((await statusDe(a.id)).status, 'pendente');
});

test('fluxo completo: manutenção → conclusão → reprovação → nova manutenção → aprovação → resolvido', async () => {
  const a = await novaAnomalia({ responsavel_id: tecnico.id });

  // agendar → em_manutencao
  const m1 = await requisicao('POST', '/manutencoes', {
    token: eng.token,
    corpo: { anomalia_id: a.id, responsavel_id: tecnico.id, descricao: 'Vedar', data_inicio: '2026-10-01' },
  });
  assert.equal(m1.status, 201);
  assert.equal((await statusDe(a.id)).status, 'em_manutencao');

  // técnico inicia e conclui → aguardando_verificacao
  assert.equal((await requisicao('PATCH', `/manutencoes/${m1.body.id}/status`, { token: tecnico.token, corpo: { status: 'em_andamento' } })).status, 200);
  assert.equal((await statusDe(a.id)).status, 'em_manutencao');
  assert.equal((await requisicao('PATCH', `/manutencoes/${m1.body.id}/status`, { token: tecnico.token, corpo: { status: 'concluida' } })).status, 200);
  assert.equal((await statusDe(a.id)).status, 'aguardando_verificacao');

  // reprovar exige motivo; com motivo volta a pendente
  assert.equal((await requisicao('POST', `/anomalias/${a.id}/verificar`, { token: eng.token, corpo: { aprovada: false } })).status, 400);
  assert.equal((await requisicao('POST', `/anomalias/${a.id}/verificar`, { token: eng.token, corpo: { aprovada: false, observacao: 'Ainda vaza' } })).status, 200);
  assert.equal((await statusDe(a.id)).status, 'pendente');

  // nova manutenção, conclui e aprova → resolvido
  const m2 = await requisicao('POST', '/manutencoes', { token: eng.token, corpo: { anomalia_id: a.id, responsavel_id: tecnico.id } });
  assert.equal(m2.status, 201);
  await requisicao('PATCH', `/manutencoes/${m2.body.id}/status`, { token: tecnico.token, corpo: { status: 'concluida' } });
  assert.equal((await statusDe(a.id)).status, 'aguardando_verificacao');
  assert.equal((await requisicao('POST', `/anomalias/${a.id}/verificar`, { token: eng.token, corpo: { aprovada: true } })).status, 200);

  const final = await statusDe(a.id);
  assert.equal(final.status, 'resolvido');
  assert.equal(final.manutencoes.length, 2);
  assert.ok(final.historico.some((h) => h.status_novo === 'resolvido'), 'histórico deve registrar a resolução');
  assert.ok(final.historico.length >= 5, 'cada transição deve deixar rastro no histórico');

  // não agenda manutenção em anomalia resolvida
  const bloqueada = await requisicao('POST', '/manutencoes', { token: eng.token, corpo: { anomalia_id: a.id, responsavel_id: tecnico.id } });
  assert.equal(bloqueada.status, 400);
});

test('"resolvido" não pode ser definido manualmente; anomalia resolvida pode ser reaberta', async () => {
  const a = await novaAnomalia({ responsavel_id: tecnico.id });
  const manual = await requisicao('PATCH', `/anomalias/${a.id}/status`, { token: eng.token, corpo: { status: 'resolvido' } });
  assert.equal(manual.status, 400);

  const m = await requisicao('POST', '/manutencoes', { token: eng.token, corpo: { anomalia_id: a.id, responsavel_id: tecnico.id } });
  await requisicao('PATCH', `/manutencoes/${m.body.id}/status`, { token: tecnico.token, corpo: { status: 'concluida' } });
  await requisicao('POST', `/anomalias/${a.id}/verificar`, { token: eng.token, corpo: { aprovada: true } });
  const reabrir = await requisicao('PATCH', `/anomalias/${a.id}/status`, { token: eng.token, corpo: { status: 'pendente' } });
  assert.equal(reabrir.status, 200);
  assert.equal((await statusDe(a.id)).status, 'pendente');
});

test('excluir a única manutenção ativa devolve a anomalia para "pendente"', async () => {
  const a = await novaAnomalia({ responsavel_id: tecnico.id });
  const m = await requisicao('POST', '/manutencoes', { token: eng.token, corpo: { anomalia_id: a.id, responsavel_id: tecnico.id } });
  assert.equal((await statusDe(a.id)).status, 'em_manutencao');
  assert.equal((await requisicao('DELETE', `/manutencoes/${m.body.id}`, { token: admin.token })).status, 200);
  assert.equal((await statusDe(a.id)).status, 'pendente');
});

test('permissões: perfil "manutencao" não cria anomalia e só mexe nas próprias manutenções', async () => {
  const proibido = await requisicao('POST', '/anomalias', {
    token: tecnico.token,
    corpo: { inspecao_id: cenario.inspecao.id, ambiente_id: cenario.ambiente.id, titulo: 'X' },
  });
  assert.equal(proibido.status, 403);

  const a = await novaAnomalia({ responsavel_id: tecnico.id });
  const m = await requisicao('POST', '/manutencoes', { token: eng.token, corpo: { anomalia_id: a.id, responsavel_id: tecnico.id } });
  const alheia = await requisicao('PATCH', `/manutencoes/${m.body.id}/status`, { token: outroTecnico.token, corpo: { status: 'em_andamento' } });
  assert.equal(alheia.status, 403);
  assert.equal((await requisicao('DELETE', `/manutencoes/${m.body.id}`, { token: eng.token })).status, 403, 'engenheiro não exclui manutenção');
});

test('validações: prioridade, prazo e ambiente de outro prédio são rejeitados', async () => {
  const base = { inspecao_id: cenario.inspecao.id, ambiente_id: cenario.ambiente.id, titulo: 'V' };
  assert.equal((await requisicao('POST', '/anomalias', { token: eng.token, corpo: { ...base, prioridade: 'urgentissima' } })).status, 400);
  assert.equal((await requisicao('POST', '/anomalias', { token: eng.token, corpo: { ...base, prazo: '31/12/2026' } })).status, 400);
  assert.equal((await requisicao('POST', '/anomalias', { token: eng.token, corpo: { ...base, titulo: '' } })).status, 400);

  const outro = await criarCenario(admin.token);
  const cruzado = await requisicao('POST', '/anomalias', { token: eng.token, corpo: { ...base, ambiente_id: outro.ambiente.id } });
  assert.equal(cruzado.status, 400);
});

test('notificações respeitam o escopo do perfil e não duplicam anomalias', async () => {
  const a = await novaAnomalia({ titulo: 'Vencida e crítica', prioridade: 'critica', prazo: '2020-01-01', responsavel_id: tecnico.id });

  const doAdmin = (await requisicao('GET', '/notificacoes', { token: admin.token })).body;
  const doTecnico = (await requisicao('GET', '/notificacoes', { token: tecnico.token })).body;
  const doOutro = (await requisicao('GET', '/notificacoes', { token: outroTecnico.token })).body;

  const alertasDaAnomalia = (n) => n.itens.filter((i) => i.link === `/anomalias/${a.id}` && i.tipo !== 'manutencao');
  assert.equal(alertasDaAnomalia(doAdmin).length, 1, 'vencida + crítica gera um único alerta');
  assert.equal(alertasDaAnomalia(doAdmin)[0].tipo, 'vencida');
  assert.equal(alertasDaAnomalia(doTecnico).length, 1, 'o responsável vê a própria anomalia');
  assert.equal(alertasDaAnomalia(doOutro).length, 0, 'quem não é responsável não vê');
});
