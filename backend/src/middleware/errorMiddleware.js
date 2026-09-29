function notFound(req, res, next) {
  res.status(404).json({ message: `Rota não encontrada: ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err);
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    message: err.message || 'Erro interno do servidor.',
  });
}

module.exports = { notFound, errorHandler };
