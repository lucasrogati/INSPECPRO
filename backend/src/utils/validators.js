const TIPOS_USUARIO = ['administrador', 'engenheiro', 'manutencao', 'gestor'];
const STATUS_INSPECAO = ['planejada', 'em_andamento', 'concluida'];

function isEmailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '');
}

module.exports = { TIPOS_USUARIO, STATUS_INSPECAO, isEmailValido };
