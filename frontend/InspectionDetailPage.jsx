export function formatarData(valor) {
  if (!valor) return '—';
  const [ano, mes, dia] = String(valor).slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
}

export function formatarDataHora(valor) {
  if (!valor) return '—';
  return new Date(String(valor).replace(' ', 'T')).toLocaleString('pt-BR');
}

// Converte "2026-09-29 10:00:00" ou "2026-09-29" no valor esperado por <input type="date">.
export function toInputDate(valor) {
  if (!valor) return '';
  return String(valor).slice(0, 10);
}

export function rotuloAmbiente(a) {
  return [a.bloco, a.andar, a.nome].filter(Boolean).join(' · ');
}

export function baixarArquivo(blob, nome) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nome;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
