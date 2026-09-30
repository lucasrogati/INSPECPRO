const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Mesma base usada por app.js (express.static('uploads')): relativa ao diretório de execução.
const PASTA_ANOMALIAS = path.resolve('uploads', 'anomalias');
fs.mkdirSync(PASTA_ANOMALIAS, { recursive: true });

const TIPOS_IMAGEM = ['image/jpeg', 'image/png', 'image/webp'];
const EXTENSOES = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, PASTA_ANOMALIAS),
  filename: (req, file, cb) => {
    const sufixo = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `anomalia-${req.params.id}-${sufixo}${EXTENSOES[file.mimetype]}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 6 }, // 5 MB por foto, até 6 por envio
  fileFilter: (req, file, cb) => {
    if (!TIPOS_IMAGEM.includes(file.mimetype)) {
      const err = new Error('Envie apenas imagens JPG, PNG ou WEBP.');
      err.code = 'TIPO_INVALIDO';
      return cb(err);
    }
    cb(null, true);
  },
});

/**
 * Middleware para o campo "fotos" (múltiplos arquivos) que converte erros do Multer
 * em respostas 400 legíveis, em vez de um 500 genérico.
 */
function uploadFotos(req, res, next) {
  upload.array('fotos', 6)(req, res, (err) => {
    if (!err) return next();

    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Cada foto deve ter no máximo 5 MB.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ message: 'Envie no máximo 6 fotos por vez.' });
    }
    if (err.code === 'TIPO_INVALIDO') {
      return res.status(400).json({ message: err.message });
    }
    return next(err);
  });
}

module.exports = { uploadFotos, PASTA_ANOMALIAS };
