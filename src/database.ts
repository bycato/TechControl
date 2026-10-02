import * as SQLite from 'expo-sqlite';
import type { DadosOrdem, OrdemServico } from './types';

/**
 * Prepara o banco local das ordens de serviço e retorna a conexão para uso no app.
 * Pode ser chamada novamente sem apagar a tabela ou os registros existentes.
 */
export async function inicializarBanco(): Promise<SQLite.SQLiteDatabase> {
  // O arquivo mantém os dados no dispositivo mesmo depois de fechar o aplicativo.
  const banco = await SQLite.openDatabaseAsync('techcontrol.db');

  // Cada registro representa uma ordem de serviço, com os campos definidos em types.ts.
  // IF NOT EXISTS cria a tabela somente se ela ainda não existir.
  // As datas são textos no formato AAAA-MM-DD; fotoUri guarda o caminho da foto ou NULL.
  // A situação é salva, mas "Atrasado" é calculado em utils/status.ts e não fica no banco.
  await banco.execAsync(`
    CREATE TABLE IF NOT EXISTS ordens_servico (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nomeCliente TEXT NOT NULL,
      equipamento TEXT NOT NULL,
      defeitoRelatado TEXT NOT NULL,
      dataEntrada TEXT NOT NULL,
      previsaoEntrega TEXT NOT NULL,
      fotoUri TEXT,
      situacao TEXT NOT NULL
        CHECK (situacao IN ('Em análise', 'Em manutenção', 'Pronto'))
    );
  `);

  return banco;
}

/** Retorna as ordens com as entradas mais recentes primeiro. */
export async function listarOrdens(): Promise<OrdemServico[]> {
  const banco = await inicializarBanco();

  return banco.getAllAsync<OrdemServico>(`
    SELECT id, nomeCliente, equipamento, defeitoRelatado,
           dataEntrada, previsaoEntrega, fotoUri, situacao
    FROM ordens_servico
    ORDER BY dataEntrada DESC, id DESC;
  `);
}

/** Busca uma ordem pelo ID ou retorna null quando ela não existe. */
export async function buscarOrdem(id: number): Promise<OrdemServico | null> {
  const banco = await inicializarBanco();
  return banco.getFirstAsync<OrdemServico>(
    `SELECT id, nomeCliente, equipamento, defeitoRelatado,
            dataEntrada, previsaoEntrega, fotoUri, situacao
     FROM ordens_servico WHERE id = ?`,
    id
  );
}

/** Cadastra uma ordem e retorna o ID gerado pelo SQLite. */
export async function cadastrarOrdem(dados: DadosOrdem): Promise<number> {
  const banco = await inicializarBanco();
  const resultado = await banco.runAsync(
    `INSERT INTO ordens_servico
      (nomeCliente, equipamento, defeitoRelatado, dataEntrada,
       previsaoEntrega, fotoUri, situacao)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    dados.nomeCliente,
    dados.equipamento,
    dados.defeitoRelatado,
    dados.dataEntrada,
    dados.previsaoEntrega,
    dados.fotoUri,
    dados.situacao
  );
  return resultado.lastInsertRowId;
}

/** Atualiza os dados da ordem identificada pelo ID. */
export async function editarOrdem(id: number, dados: DadosOrdem): Promise<void> {
  const banco = await inicializarBanco();
  const resultado = await banco.runAsync(
    `UPDATE ordens_servico
     SET nomeCliente = ?, equipamento = ?, defeitoRelatado = ?,
         dataEntrada = ?, previsaoEntrega = ?, fotoUri = ?, situacao = ?
     WHERE id = ?`,
    dados.nomeCliente,
    dados.equipamento,
    dados.defeitoRelatado,
    dados.dataEntrada,
    dados.previsaoEntrega,
    dados.fotoUri,
    dados.situacao,
    id
  );
  if (resultado.changes === 0) throw new Error('Ordem de serviço não encontrada.');
}

/** Exclui a ordem identificada pelo ID. */
export async function excluirOrdem(id: number): Promise<void> {
  const banco = await inicializarBanco();
  const resultado = await banco.runAsync('DELETE FROM ordens_servico WHERE id = ?', id);
  if (resultado.changes === 0) throw new Error('Ordem de serviço não encontrada.');
}
