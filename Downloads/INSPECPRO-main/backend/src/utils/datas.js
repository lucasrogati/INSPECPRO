// Data de hoje no fuso do servidor, formato YYYY-MM-DD.
// (toISOString() usaria UTC e viraria "amanhã" à noite no horário de Brasília.)
function hoje() {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

module.exports = { hoje };
