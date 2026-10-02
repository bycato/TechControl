// Situação informada no cadastro ou na edição do serviço.
export type SituacaoServico = 'Em análise' | 'Em manutenção' | 'Pronto';

// "Atrasado" será calculado a partir da previsão de entrega e da situação.
export type StatusServico = SituacaoServico | 'Atrasado';

export interface OrdemServico {
  id: number;
  nomeCliente: string;
  equipamento: string;
  defeitoRelatado: string;
  // Datas no formato AAAA-MM-DD, sem horário.
  dataEntrada: string;
  previsaoEntrega: string;
  // Caminho da foto; null quando não houver foto.
  fotoUri: string | null;
  situacao: SituacaoServico;
}

// Dados usados no cadastro e na edição; o banco atribui o ID.
export type DadosOrdem = Omit<OrdemServico, 'id'>;
