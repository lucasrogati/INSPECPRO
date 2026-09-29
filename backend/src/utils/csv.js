// Gera CSV compatível com o Excel em português: separador ";" e BOM UTF-8 (acentos corretos).
function escapar(valor) {
  if (valor === null || valor === undefined) return '';
  const texto = String(valor).replace(/\r?\n/g, ' ');
  return /[";]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

/**
 * colunas: [{ titulo: 'Prédio', valor: (linha) => linha.predio_nome }]
 */
function gerarCsv(colunas, linhas) {
  const cabecalho = colunas.map((c) => escapar(c.titulo)).join(';');
  const corpo = linhas.map((l) => colunas.map((c) => escapar(c.valor(l))).join(';'));
  return `\uFEFF${[cabecalho, ...corpo].join('\r\n')}\r\n`;
}

module.exports = { gerarCsv };
