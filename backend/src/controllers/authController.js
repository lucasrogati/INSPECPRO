const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const generateToken = require('../utils/generateToken');

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

module.exports = { login, me };
