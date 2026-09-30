require('dotenv').config();
const app = require('./app');
const { testConnection } = require('./config/db');

const PORT = process.env.PORT || 4000;

// Falha cedo se o segredo do JWT estiver ausente ou ainda for o valor de exemplo.
const SEGREDO_EXEMPLO = 'troque_esta_chave_por_uma_string_segura_e_aleatoria';
if (!process.env.JWT_SECRET) {
  console.error('[server] JWT_SECRET não definido. Configure o arquivo .env.');
  process.exit(1);
}
if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET === SEGREDO_EXEMPLO) {
  console.error('[server] Troque o JWT_SECRET de exemplo antes de rodar em produção.');
  process.exit(1);
}

(async () => {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`[server] InspecPro API rodando em http://localhost:${PORT}`);
  });
})();
