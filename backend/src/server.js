require('dotenv').config();
const app = require('./app');
const { testConnection } = require('./config/db');

const PORT = process.env.PORT || 4000;

(async () => {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`[server] InspecPro API rodando em http://localhost:${PORT}`);
  });
})();
