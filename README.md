# DH_Nix_Project

Projeto de criação de ficha, inspirado em Roll20, Owlbear e outros. Usado para jogar Daggerheart com meus amigos e testando o Claude para criação de sites.

Site: https://snowv4.github.io/DH_Nix_Project/

- `spec.md`: especificação do projeto.
- `CLAUDE.md`: instruções para o Claude Code.

## Rodar localmente

Requer Node 22.22.3+ (ou 24) e Java (para os emuladores do Firebase).

```bash
npm install
npm run emulators   # terminal 1: Auth + Firestore locais
npm start           # terminal 2: http://localhost:4200 (usa os emuladores)
```

`npm test`, `npm run lint` e `npm run build` precisam passar antes de cada push. O deploy no GitHub Pages é automático a cada push na `main`.

## Trocar a imagem do login

Coloque a imagem em `public/images/login-bg.jpg`.

## Licença do conteúdo de jogo

Este projeto inclui materiais do Daggerheart System Reference Document 2.0, © Critical Role, LLC, sob os termos da Darrington Press Community Gaming License (DPCGL). Mais informações em https://www.daggerheart.com e a licença em https://darringtonpress.com/license/.

O conteúdo do SRD em `src/app/core/data/srd/` foi **traduzido para o português e resumido/adaptado** por este projeto (descrições de ancestralidades e comunidades estão condensadas). Não houve modificações anteriores por terceiros. Este projeto não é afiliado, patrocinado nem endossado pela Darrington Press ou pela Critical Role.
