/**
 * Utilitários de teste: banco isolado (inspecpro_test), servidor HTTP em porta efêmera e cliente fetch.
 * O usuário do MySQL precisa de permissão para criar/remover o banco de testes.
 * IMPORTANTE: este arquivo define as variáveis de ambiente — deve ser o PRIMEIRO require dos testes.
 */
const fs = require('fs');
const path = require('path');

const DB_TESTE = process.env.DB_TEST_NAME || 'inspecpro_test';
process.env.NODE_ENV = 'test';
process.env.DB_NAME = DB_TESTE;
process.env.JWT_SECRET = 'segredo-somente-para-testes';
require('dotenv').config({ path: path.join(__dirname, '..', '.env') }); // credenciais do MySQL (não sobrescreve as acima)

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { pool } = require('../src/config/db');
const app = require('../src/app');

let servidor;
let baseUrl;

/** Recria o banco de testes a partir do schema.sql oficial. */
async function recriarBanco() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });
  const schema = fs
    .readFileSync(path.join(__dirname, '..', 'src', 'config', 'schema.sql'), 'utf8')
    .replace(/CREATE DATABASE IF NOT EXISTS inspecpro/, `CREATE DATABASE IF NOT EXISTS ${DB_TESTE}`)
    .replace(/USE inspecpro;/, `USE ${DB_TESTE};`);
  await conn.query(`DROP DATABASE IF EXISTS ${DB_TESTE}`);
  await conn.query(schema);
  await conn.end();
}

async function iniciar() {
  await recriarBanco();
  await new Promise((resolve) => {
    servidor = app.listen(0, '127.0.0.1', resolve);
  });
  baseUrl = `http://127.0.0.1:${servidor.address().port}/api`;
}

async function encerrar() {
  await new Promise((resolve) => servidor.close(resolve));
  await pool.end();
}

/** Cria um usuário direto no banco e devolve { id, email, senha, token }. */
async function criarUsuario(tipo, sobrenome = tipo) {
  const email = `${sobrenome}@teste.com`;
  const senha = 'Senha@123';
  const hash = await bcrypt.hash(senha, 4);
  const [r] = await pool.query('INSERT INTO usuarios (nome, email, senha, tipo, ativo) VALUES (?, ?, ?, ?, 1)', [
    `Usuário ${sobrenome}`,
    email,
    hash,
    tipo,
  ]);
  const { body } = await requisicao('POST', '/auth/login', { corpo: { email, senha } });
  return { id: r.insertId, email, senha, token: body.token };
}

/** Requisição JSON. Retorna { status, body }. */
async function requisicao(metodo, rota, { token, corpo, headers } = {}) {
  const resposta = await fetch(`${baseUrl}${rota}`, {
    method: metodo,
    headers: {
      ...(corpo ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  const texto = await resposta.text();
  let body = null;
  try {
    body = texto ? JSON.parse(texto) : null;
  } catch {
    body = texto;
  }
  return { status: resposta.status, body, headers: resposta.headers };
}

/** Cria prédio, ambiente e inspeção prontos para receber anomalias. */
async function criarCenario(tokenAdmin) {
  const predio = (await requisicao('POST', '/predios', { token: tokenAdmin, corpo: { nome: 'Edifício T', endereco: 'Rua 1', tipo: 'Comercial' } })).body;
  const ambiente = (await requisicao('POST', '/ambientes', { token: tokenAdmin, corpo: { predio_id: predio.id, bloco: 'A', andar: '1', nome: 'Hall' } })).body;
  const inspecao = (await requisicao('POST', '/inspecoes', { token: tokenAdmin, corpo: { predio_id: predio.id, data_inspecao: '2026-09-01', status: 'em_andamento' } })).body;
  return { predio, ambiente, inspecao };
}

module.exports = { iniciar, encerrar, criarUsuario, requisicao, criarCenario, pool };
