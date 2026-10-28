# CLAUDE.md — DHsite

VTT para **Daggerheart** (fichas, criação guiada de personagem, painel do mestre, mapa e tela de TV) para um grupo de amigos.
**A especificação completa está em `spec.md`. Leia a seção relevante antes de começar qualquer tarefa.**

## Stack
- **Angular** (última estável): standalone components, signals, control flow novo (`@if`, `@for`, `@switch`), `inject()`.
- **Tailwind CSS** + **Angular CDK**. Sem Angular Material.
- **Firebase**: Auth (anônimo), Firestore (tempo real), Emulator Suite. SDK modular `firebase` encapsulado em serviços (`core/firebase/`). Storage fica para depois (exige plano pago).
- Deploy: **GitHub Pages** via GitHub Actions a cada push na `main` (Node 24).
- **Konva** para o mapa.
- UI em **pt-BR**; código, nomes de arquivos, variáveis e commits em **inglês**.

## Comandos
```bash
npm start                 # ng serve
npm run build             # ng build
npm test                  # testes unitários
npm run lint              # eslint
npm run emulators        # auth + firestore locais (o `npm start` usa os emuladores)
```
Se algum script não existir ainda no `package.json`, crie.

## Estrutura
```
src/app/
  core/      auth, firebase, models, data (conteúdo do jogo em JSON/TS), rules (funções puras)
  shared/ui  componentes visuais reutilizáveis
  features/  login, character-sheet, gm-panel, dice (e depois character-creation,
             level-up, adversaries, map, tv)
```
Cada feature tem rotas lazy (`loadComponent`/`loadChildren`).

## Convenções de código
- Só **standalone components**, `ChangeDetectionStrategy.OnPush`, nada de NgModules.
- Estado com **signals** (`signal`, `computed`, `effect` só quando for preciso). Stores por feature como serviços `@Injectable({ providedIn: 'root' })` ou providos na rota.
- Use `input()`, `output()`, `model()` em vez de `@Input/@Output`.
- Formulários: **Reactive Forms tipados**.
- TypeScript `strict`. Proibido `any`; use `unknown` + narrowing.
- Componentes não falam com o Firestore diretamente: sempre por um **serviço/repositório** em `core/` ou na feature.
- **Regras do jogo ficam em `core/rules/` como funções puras** (sem Angular, sem Firebase), com testes unitários. Ex.: `rollDuality()`, `applyDamage()`, `validateTraitAssignment()`, `availableAdvancements()`.
- Conteúdo do jogo (classes, ancestralidades, comunidades, cartas, armas, armaduras) em arquivos estáticos tipados em `core/data/`. **Não** colocar no Firestore.
- Aleatoriedade dos dados: `crypto.getRandomValues`, nunca `Math.random`.
- Mobile-first: estilizar para 360px primeiro e expandir com `sm:`/`md:`/`lg:`. Alvos de toque ≥ 44px. Não depender de hover.
- Animações respeitam `prefers-reduced-motion`.
- Strings da UI em pt-BR centralizadas (ex.: `core/i18n/pt-br.ts`), para trocar termos fácil.
- Cores fixas da Dualidade: Esperança = âmbar/dourado, Medo = roxo/violeta (tokens no Tailwind config).

## Regras do Daggerheart: atenção
- Os números da seção 3 do `spec.md` **precisam ser conferidos** no livro/SRD. **Nunca invente valor de regra, texto de carta ou estatística.** Se não souber, deixe `// TODO(regra): conferir <o quê>` e me avise no final da tarefa.
- Use os ids em inglês do glossário do `spec.md` (`hope`, `fear`, `stress`, `evasion`, `thresholds.major` etc.).
- Ao digitar conteúdo do SRD, comece pelo mínimo necessário (nível 1) e me pergunte antes de preencher volume grande.

## Firebase
- Modelo de dados: seção 5 do `spec.md`. Se precisar mudar, atualize o `spec.md` junto.
- Toda mudança de acesso a dados vem acompanhada de atualização em `firestore.rules` **e** teste das regras no emulador.
- Desenvolvimento usa os **emuladores**; nunca escreva em produção durante testes.
- Economizar leituras (plano gratuito): listeners só onde precisa ao vivo, desinscrever ao sair da tela, paginar/limpar o log de rolagens.

## Como trabalhar comigo
- Trabalhe **por fase** (seção 8 do `spec.md`). Não puxe coisa de fase futura sem eu pedir.
- Antes de uma tarefa grande, mostre um plano curto (lista de arquivos + passos) e espere meu ok.
- Mudanças pequenas e focadas. Ao terminar: `npm run build`, `npm test` e `npm run lint` precisam passar.
- **Não adicione dependências novas sem perguntar.**
- Commits em inglês, estilo Conventional Commits (`feat(sheet): add hope tracker`). Só faça commit/push quando eu pedir.
- **Seja econômico com tokens**: não releia arquivos à toa, não despeje arquivos inteiros na resposta, respostas curtas. Explique só o que for importante para eu revisar.
- Sou estudante de engenharia elétrica e uso este projeto para aprender Angular: quando usar um recurso menos óbvio do Angular (signals, deferrable views, etc.), explique em uma linha por que escolheu.
- Se algo no `spec.md` estiver ambíguo ou conflitar com uma boa prática, pergunte em vez de assumir.

## Prioridades do produto (em caso de dúvida)
1. A **criação guiada de personagem** é a parte mais importante: precisa ser clara para quem nunca jogou.
2. A ficha precisa ser rápida de usar **no celular durante a sessão**.
3. O mestre vê tudo **em tempo real** no notebook.
4. Mapa e TV vêm depois e podem ser simples.