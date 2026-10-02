/** Converte uma data válida de DD/MM/AAAA para AAAA-MM-DD, formato salvo no banco. */
export function dataParaBanco(texto: string): string | null {
  const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto.trim());
  if (!partes) return null;

  const [, dia, mes, ano] = partes;
  const data = new Date(Number(ano), Number(mes) - 1, Number(dia));
  if (
    data.getFullYear() !== Number(ano) ||
    data.getMonth() + 1 !== Number(mes) ||
    data.getDate() !== Number(dia)
  ) return null;

  return `${ano}-${mes}-${dia}`;
}

/** Mostra uma data salva em AAAA-MM-DD como DD/MM/AAAA. */
export function dataParaTela(data: string): string {
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}
