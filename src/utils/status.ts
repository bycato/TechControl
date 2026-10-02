import type { SituacaoServico, StatusServico } from '../types';

export function calcularStatus(
  situacao: SituacaoServico,
  previsaoEntrega: string,
  hoje: Date = new Date()
): StatusServico {
  if (situacao === 'Pronto') {
    return 'Pronto';
  }

  // Usa a data local do celular, no mesmo formato AAAA-MM-DD da previsão.
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  const dataHoje = `${ano}-${mes}-${dia}`;

  if (previsaoEntrega < dataHoje) {
    return 'Atrasado';
  }

  return situacao;
}
