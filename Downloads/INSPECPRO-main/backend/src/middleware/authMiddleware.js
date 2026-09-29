const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

/**
 * Verifica se o token JWT enviado no header Authorization é válido.
 * Anexa os dados do usuário autenticado em req.usuario.
 */
async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Não autorizado. Token não informado.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [rows] = await pool.query(
      'SELECT id, nome, email, tipo, ativo FROM usuarios WHERE id = ?',
      [decoded.id]
    );

    if (rows.length === 0 || !rows[0].ativo) {
      return res.status(401).json({ message: 'Usuário inválido ou inativo.' });
    }

    req.usuario = rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido ou expirado.' });
  }
}

/**
 * Restringe o acesso a determinados tipos de usuário.
 * Uso: authorize('administrador', 'gestor')
 */
function authorize(...tiposPermitidos) {
  return (req, res, next) => {
    if (!req.usuario || !tiposPermitidos.includes(req.usuario.tipo)) {
      return res.status(403).json({ message: 'Acesso negado para este perfil de usuário.' });
    }
    next();
  };
}

module.exports = { protect, authorize };
