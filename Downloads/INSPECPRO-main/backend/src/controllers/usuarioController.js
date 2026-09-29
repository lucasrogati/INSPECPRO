const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const { TIPOS_USUARIO, isEmailValido } = require('../utils/validators');

const CAMPOS_PUBLICOS =
  'id, nome, email, tipo, ativo, created_at, updated_at';

/**
 * GET /api/usuarios
 * Lista todos os usuários (sem a senha).
 */
async function listar(req, res) {
  const { tipo, ativo, busca } = req.query;
  const condicoes = [];
  const valores = [];

  if (tipo) {
    condicoes.push('tipo = ?');
    valores.push(tipo);
  }
  if (ativo !== undefined) {
    condicoes.push('ativo = ?');
    valores.push(ativo === 'true' || ativo === '1' ? 1 : 0);
  }
  if (busca) {
    condicoes.push('(nome LIKE ? OR email LIKE ?)');
    valores.push(`%${busca}%`, `%${busca}%`);
  }

  const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT ${CAMPOS_PUBLICOS} FROM usuarios ${where} ORDER BY nome ASC`,
    valores
  );
  res.json(rows);
}

/**
 * GET /api/usuarios/:id
 */
async function obter(req, res) {
  const [rows] = await pool.query(
    `SELECT ${CAMPOS_PUBLICOS} FROM usuarios WHERE id = ?`,
    [req.params.id]
  );
  if (rows.length === 0) {
    return res.status(404).json({ message: 'Usuário não encontrado.' });
  }
  res.json(rows[0]);
}

/**
 * POST /api/usuarios
 */
async function criar(req, res) {
  const { nome, email, senha, tipo } = req.body;

  if (!nome || !email || !senha || !tipo) {
    return res.status(400).json({ message: 'Nome, e-mail, senha e tipo são obrigatórios.' });
  }
  if (!isEmailValido(email)) {
    return res.status(400).json({ message: 'E-mail inválido.' });
  }
  if (!TIPOS_USUARIO.includes(tipo)) {
    return res.status(400).json({ message: `Tipo inválido. Use um de: ${TIPOS_USUARIO.join(', ')}.` });
  }
  if (senha.length < 6) {
    return res.status(400).json({ message: 'A senha deve ter ao menos 6 caracteres.' });
  }

  const [existente] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);
  if (existente.length > 0) {
    return res.status(409).json({ message: 'Já existe um usuário com este e-mail.' });
  }

  const senhaHash = await bcrypt.hash(senha, 10);
  const [resultado] = await pool.query(
    'INSERT INTO usuarios (nome, email, senha, tipo, ativo) VALUES (?, ?, ?, ?, 1)',
    [nome, email, senhaHash, tipo]
  );

  const [rows] = await pool.query(
    `SELECT ${CAMPOS_PUBLICOS} FROM usuarios WHERE id = ?`,
    [resultado.insertId]
  );
  res.status(201).json(rows[0]);
}

/**
 * PUT /api/usuarios/:id
 */
async function atualizar(req, res) {
  const { id } = req.params;
  const { nome, email, tipo, ativo, senha } = req.body;

  const [existentes] = await pool.query('SELECT * FROM usuarios WHERE id = ?', [id]);
  if (existentes.length === 0) {
    return res.status(404).json({ message: 'Usuário não encontrado.' });
  }

  if (tipo && !TIPOS_USUARIO.includes(tipo)) {
    return res.status(400).json({ message: `Tipo inválido. Use um de: ${TIPOS_USUARIO.join(', ')}.` });
  }
  if (email && !isEmailValido(email)) {
    return res.status(400).json({ message: 'E-mail inválido.' });
  }

  if (email) {
    const [emailEmUso] = await pool.query('SELECT id FROM usuarios WHERE email = ? AND id != ?', [
      email,
      id,
    ]);
    if (emailEmUso.length > 0) {
      return res.status(409).json({ message: 'Este e-mail já está em uso por outro usuário.' });
    }
  }

  const atual = existentes[0];
  const campos = {
    nome: nome ?? atual.nome,
    email: email ?? atual.email,
    tipo: tipo ?? atual.tipo,
    ativo: ativo !== undefined ? (ativo ? 1 : 0) : atual.ativo,
  };

  if (senha) {
    if (senha.length < 6) {
      return res.status(400).json({ message: 'A senha deve ter ao menos 6 caracteres.' });
    }
    campos.senha = await bcrypt.hash(senha, 10);
    await pool.query(
      'UPDATE usuarios SET nome = ?, email = ?, tipo = ?, ativo = ?, senha = ? WHERE id = ?',
      [campos.nome, campos.email, campos.tipo, campos.ativo, campos.senha, id]
    );
  } else {
    await pool.query('UPDATE usuarios SET nome = ?, email = ?, tipo = ?, ativo = ? WHERE id = ?', [
      campos.nome,
      campos.email,
      campos.tipo,
      campos.ativo,
      id,
    ]);
  }

  const [rows] = await pool.query(`SELECT ${CAMPOS_PUBLICOS} FROM usuarios WHERE id = ?`, [id]);
  res.json(rows[0]);
}

/**
 * DELETE /api/usuarios/:id
 * Soft delete — inativa o usuário em vez de removê-lo (preserva o histórico/FKs).
 */
async function remover(req, res) {
  const { id } = req.params;

  if (Number(id) === req.usuario.id) {
    return res.status(400).json({ message: 'Você não pode inativar o próprio usuário.' });
  }

  const [resultado] = await pool.query('UPDATE usuarios SET ativo = 0 WHERE id = ?', [id]);
  if (resultado.affectedRows === 0) {
    return res.status(404).json({ message: 'Usuário não encontrado.' });
  }
  res.json({ message: 'Usuário inativado com sucesso.' });
}

module.exports = { listar, obter, criar, atualizar, remover };
