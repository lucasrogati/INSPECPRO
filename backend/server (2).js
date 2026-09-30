const rateLimit = require('express-rate-limit');

/**
 * Limita tentativas de login por IP para dificultar ataques de força bruta.
 * Só tentativas malsucedidas contam (login correto não consome a cota).
 * Configurável por LOGIN_RATE_MAX (padrão 10) e LOGIN_RATE_WINDOW_MIN (padrão 15).
 */
const loginLimiter = rateLimit({
  windowMs: Number(process.env.LOGIN_RATE_WINDOW_MIN || 15) * 60 * 1000,
  limit: Number(process.env.LOGIN_RATE_MAX || 10),
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Muitas tentativas de login. Tente novamente em alguns minutos.' },
});

module.exports = { loginLimiter };
