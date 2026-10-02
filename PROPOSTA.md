# Proposta — TechControl

**Integrantes:** preencher com os nomes da dupla antes da entrega.

**Problema:** quem faz manutenção de computadores e notebooks precisa acompanhar o equipamento recebido, o defeito relatado e o prazo combinado com o cliente. Anotações em papel ou mensagens espalhadas dificultam localizar um serviço e perceber atrasos.

**Público-alvo:** estudantes e pequenos técnicos que recebem equipamentos para manutenção. No celular, conseguem consultar uma ordem, sua foto e o prazo durante o atendimento, sem depender de uma planilha aberta no computador.

**Item principal:** ordem de serviço. Cada ordem contém nome do cliente, equipamento, defeito relatado, data de entrada, previsão de entrega, foto do equipamento e situação do serviço. A situação é escolhida entre **Em análise**, **Em manutenção** e **Pronto**.

**Status:** o aplicativo compara a previsão de entrega com a data atual do celular. Quando a previsão já passou e a situação não é **Pronto**, exibe **Atrasado**. Nos demais casos, mostra a situação escolhida. O status aparece como selo colorido.

**Telas:**

1. **Listagem:** cliente, equipamento e selo de status de cada ordem, com busca por texto, filtro por status e botão para cadastrar.
2. **Cadastro e edição:** o mesmo formulário permite preencher ou alterar os campos e adicionar uma foto pela câmera ou galeria.
3. **Detalhes:** foto ampliada, todos os dados da ordem, selo de status e botões para editar ou excluir com confirmação.

Os dados são guardados localmente em SQLite e permanecem disponíveis depois de fechar o aplicativo.
