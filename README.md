# TechControl

Aplicativo mobile para controlar ordens de serviço de computadores e notebooks. Desenvolvido com React Native, Expo, TypeScript, Expo Router e SQLite.

## Rodar o aplicativo

Instale o [Node.js](https://nodejs.org/), abra o terminal na pasta do projeto e execute:

```bash
npm install
npm run start
```

Escaneie o QR code com o Expo Go. Para testar no navegador, pressione `w` no terminal ou execute `npm run web`. Se o celular não alcançar o computador pela rede local, inicie com `npx expo start --go --tunnel`.

## Telas e arquivos principais

- `src/app/index.tsx`: listagem, busca e filtro.
- `src/app/cadastro.tsx`: cadastro e edição no mesmo formulário.
- `src/app/detalhes.tsx`: detalhes e exclusão com confirmação.
- `src/app/_layout.tsx`: navegação e inicialização do banco.
- `src/types.ts`: tipos das ordens e dos status.
- `src/database.ts`: criação da tabela e todas as consultas SQL.
- `src/utils/status.ts`: cálculo do atraso.
- `src/utils/datas.ts`: validação e formatação das datas.
- `src/utils/foto.ts` e `foto.web.ts`: armazenamento de fotos no celular e no navegador.
- `src/components/status-badge.tsx`: selo colorido do status.
- `PROPOSTA.md`: texto da proposta para revisão da dupla.

No celular, o SQLite guarda os dados localmente e as fotos ficam nos documentos do aplicativo. No navegador, o SQLite usa armazenamento próprio do browser. Os dados do celular e do navegador não são sincronizados.

## Verificações

```bash
npm run lint
npx tsc --noEmit
npx expo-doctor
```
