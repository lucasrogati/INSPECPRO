function notFound(req, res, next) {
  res.status(404).json({ message: `Rota não encontrada: ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err);
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  // Em produção, não expõe detalhes internos (SQL, caminhos…) em erros 500.
  const ocultar = statusCode === 500 && process.env.NODE_ENV === 'production';
  res.status(statusCode).json({
    message: ocultar ? 'Erro interno do servidor.' : err.message || 'Erro interno do servidor.',
  });
}

module.exports = { notFound, errorHandler };
