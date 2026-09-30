const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// Atrás de proxy reverso (Nginx, Heroku…), informe quantos proxies confiar para o IP real do cliente.
if (process.env.TRUST_PROXY) {
  app.set('trust proxy', Number(process.env.TRUST_PROXY));
}

// As fotos em /uploads são exibidas pelo frontend (outra origem), por isso cross-origin.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// Origens permitidas (separadas por vírgula). Padrão: o frontend em desenvolvimento.
const origensPermitidas = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
app.use(cors({ origin: origensPermitidas }));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Arquivos estáticos (fotos de anomalias enviadas via Multer)
app.use('/uploads', express.static('uploads'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'InspecPro API' });
});

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
