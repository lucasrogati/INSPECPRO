const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const generateToken = require('../utils/generateToken');
const { isEmailValido } = require('../utils/validators');

/**
 * POST /api/auth/login
 * Autentica um usuário por e-mail e senha, retornando um token JWT.
 */
async function login(req, res) {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ message: 'Informe e-mail e senha.' });
  }

  const [rows] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
  const usuario = rows[0];

  if (!usuario) {
    return res.status(401).json({ message: 'E-mail ou senha inválidos.' });
  }

  if (!usuario.ativo) {
    return res.status(403).json({ message: 'Usuário inativo. Contate o administrador.' });
  }

  const senhaValida = await bcrypt.compare(senha, usuario.senha);
  if (!senhaValida) {
    return res.status(401).json({ message: 'E-mail ou senha inválidos.' });
  }

  const token = generateToken(usuario);

  return res.json({
    token,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      tipo: usuario.tipo,
    },
  });
}

/**
 * GET /api/auth/me
 * Retorna os dados do usuário autenticado (via middleware `protect`).
 */
async function me(req, res) {
  return res.json({ usuario: req.usuario });
}

/**
 * PUT /api/auth/perfil
 * Atualiza nome e e-mail do próprio usuário. O perfil (tipo) só pode ser alterado por um administrador.
 */
async function atualizarPerfil(req, res) {
  const nome = (req.body.nome || '').trim();
  const email = (req.body.email || '').trim();

  if (!nome || !email) {
    return res.status(400).json({ message: 'Nome e e-mail são obrigatórios.' });
  }
  if (!isEmailValido(email)) {
    return res.status(400).json({ message: 'E-mail inválido.' });
  }

  const [emailEmUso] = await pool.query('SELECT id FROM usuarios WHERE email = ? AND id != ?', [
    email,
    req.usuario.id,
  ]);
  if (emailEmUso.length > 0) {
    return res.status(409).json({ message: 'Este e-mail já está em uso por outro usuário.' });
  }

  await pool.query('UPDATE usuarios SET nome = ?, email = ? WHERE id = ?', [nome, email, req.usuario.id]);

  const [rows] = await pool.query('SELECT id, nome, email, tipo FROM usuarios WHERE id = ?', [
    req.usuario.id,
  ]);
  return res.json({ usuario: rows[0] });
}

/**
 * PUT /api/auth/senha
 * Troca a senha do próprio usuário, exigindo a senha atual.
 */
async function alterarSenha(req, res) {
  const { senha_atual: senhaAtual, nova_senha: novaSenha } = req.body;

  if (!senhaAtual || !novaSenha) {
    return res.status(400).json({ message: 'Informe a senha atual e a nova senha.' });
  }
  if (novaSenha.length < 6) {
    return res.status(400).json({ message: 'A nova senha deve ter ao menos 6 caracteres.' });
  }

  const [rows] = await pool.query('SELECT senha FROM usuarios WHERE id = ?', [req.usuario.id]);
  const senhaConfere = await bcrypt.compare(senhaAtual, rows[0].senha);
  if (!senhaConfere) {
    return res.status(400).json({ message: 'A senha atual está incorreta.' });
  }
  if (senhaAtual === novaSenha) {
    return res.status(400).json({ message: 'A nova senha deve ser diferente da atual.' });
  }

  const senhaHash = await bcrypt.hash(novaSenha, 10);
  await pool.query('UPDATE usuarios SET senha = ? WHERE id = ?', [senhaHash, req.usuario.id]);
  return res.json({ message: 'Senha alterada com sucesso.' });
}

module.exports = { login, me, atualizarPerfil, alterarSenha };
