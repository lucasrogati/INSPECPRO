// Express 4 não captura automaticamente rejeições de Promises em rotas async.
// Este wrapper encaminha qualquer erro para o errorHandler central.
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = asyncHandler;
