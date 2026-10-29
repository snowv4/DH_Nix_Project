# DHsite — Especificação do Projeto

> VTT (estilo Roll20/Owlbear) feito especificamente para **Daggerheart**, para um grupo fixo de amigos (1 mestre + ~5 jogadores).
> Projeto pessoal, também usado para testar até onde o Angular aguenta.

---

## 0. Decisões que mudaram a especificação original
- **Login pelo nome do personagem**, não pelo Google. A tela inicial tem uma caixa onde o jogador digita o nome do personagem:
  - ficha existe → abre a ficha;
  - ficha não existe → dois botões: **Guia de criação** e **Ficha em branco**;
  - `mestre` → pede **PIN** e abre o painel do mestre.
  Por baixo, todo navegador faz login **anônimo** no Firebase (as regras exigem `request.auth != null`).
- **Uma mesa só**: campanha fixa `campaigns/nix`. Sem convite/código por enquanto.
- O id da ficha é o nome normalizado (`"Nix Ávila"` → `nix-avila`).
- **Hospedagem no GitHub Pages** (não no Firebase Hosting). Storage adiado (plano pago).
- Painel do mestre: modo **Resumido** (PV, Estresse, Esperança, Armadura) e **Estendido**; clicar no nome abre a ficha completa num popup.
- Mapa: o mestre vê tudo; um **popup "visão dos jogadores"** vai para a TV e mostra só o que ele liberar (névoa, monstros ocultos).
- **Sem rolador de dados no site**: a mesa é presencial, com dados físicos. O site guarda fichas, Medo e recursos.
- **Conteúdo do jogo = SRD 2.0** (`DH_SRD_2_2026_08_25.pdf`), que já inclui o conteúdo de *Hope & Fear*: 13 classes, 24 ancestralidades, 15 comunidades, 10 domínios. Transcrito e **traduzido para pt-BR** em `src/app/core/data/srd/` (nome original entre parênteses). Os PDFs dos livros completos **não** entram no repositório (licença DPCGL 2.0, seção 1.5).
- Transformações (Demigod, Ghost etc.) ficam de fora da criação por enquanto: o SRD diz que são concedidas pelo mestre.

## 1. Visão geral

### 1.1 Objetivo
Um site onde:
- cada jogador **cria e guarda a ficha** do seu personagem (a parte mais importante do projeto é a **criação guiada**);
- a ficha é usada **durante a sessão** no celular/tablet: marcar PV, Estresse, Esperança, Armadura, rolar dados;
- o **mestre** tem um painel no notebook com todas as fichas ao vivo, o Medo, contadores e adversários;
- existe um **mapa de combate** simples, com uma **tela de TV** (popup/aba separada) que mostra só o que os jogadores podem ver.

### 1.2 Quem usa e onde
| Papel | Dispositivo principal | O que faz |
|---|---|---|
| Jogador | Celular / tablet (touch, tela pequena) | Cria personagem, usa a ficha na sessão, anota coisas |
| Mestre | Notebook | Painel do mestre, mapa, Medo, adversários, TV |
| TV | TV/monitor via popup do notebook ou outro aparelho | Só exibe (somente leitura) |

Tudo pela **internet** (jogadores não estão necessariamente na mesma rede). **Mobile-first é obrigatório.**

### 1.3 Fora do escopo (por enquanto)
- Chat de texto/voz/vídeo (o grupo usa Discord ou joga presencial).
- Fog of war elaborado, iluminação dinâmica, linha de visão.
- Marketplace, conteúdo de terceiros, homebrew avançado.
- Suporte a muitos grupos públicos/escala grande.
- App nativo (é PWA no máximo).

---

## 2. Stack

| Camada | Escolha | Observação |
|---|---|---|
| Front-end | **Angular** (última versão estável), standalone components, **signals**, novo control flow (`@if`, `@for`) | Sem NgModules |
| UI | **Tailwind CSS** + **Angular CDK** (overlay, drag-drop, a11y) | Sem Angular Material, para ter visual próprio |
| Back-end | **Firebase** | Sem servidor próprio |
| Autenticação | Firebase Auth — **login com Google** | |
| Banco | **Cloud Firestore** (tempo real via `onSnapshot`) | Sincroniza fichas, painel, mapa e TV |
| Arquivos | Firebase Storage | Retratos dos personagens, imagens de mapa |
| Hospedagem | Firebase Hosting | |
| Integração | **@angular/fire** | Se der problema de compatibilidade de versão, usar o SDK `firebase` modular direto em serviços |
| Mapa | **Konva** (canvas) | Tokens, grade, zoom/pan, touch |
| Testes | Runner padrão gerado pelo `ng new` + Firebase Emulator Suite | Regras do jogo têm testes unitários obrigatórios |
| PWA | `@angular/pwa` (fase final) | "Adicionar à tela inicial" no celular |

---

## 3. Regras do Daggerheart que o sistema precisa modelar

> ⚠️ **Os números abaixo precisam ser conferidos no livro / SRD oficial antes de virarem dado.** Onde houver dúvida, deixar `// TODO(regra): conferir` no código em vez de inventar.
> Conteúdo do jogo deve vir do **SRD do Daggerheart** (licença Darrington Press Community Gaming License). Como o site é privado para o grupo, não há problema, mas **não colocar texto do livro em repositório público** sem checar a licença.

### 3.1 Glossário (UI em pt-BR, código em inglês)
| Termo pt-BR (UI) | Termo original | Nome no código |
|---|---|---|
| Esperança | Hope | `hope` |
| Medo | Fear | `fear` |
| Estresse | Stress | `stress` |
| Pontos de Vida (PV) | Hit Points | `hp` |
| Evasão | Evasion | `evasion` |
| Armadura / Espaços de Armadura | Armor Score / Armor Slots | `armorScore`, `armorSlots` |
| Limiares de dano (Maior / Grave) | Damage Thresholds (Major / Severe) | `thresholds.major`, `thresholds.severe` |
| Proficiência | Proficiency | `proficiency` |
| Experiências | Experiences | `experiences` |
| Atributos | Traits | `traits` |
| Cartas de domínio | Domain Cards | `domainCards` |
| Mão (cartas ativas) / Cofre | Loadout / Vault | `loadout`, `vault` |
| Ancestralidade | Ancestry | `ancestry` |
| Comunidade | Community | `community` |
| Classe / Subclasse | Class / Subclass | `class`, `subclass` |
| Dados de Dualidade | Duality Dice | `dualityRoll` |
| Contador regressivo | Countdown | `countdown` |
| Adversário | Adversary | `adversary` |
| Patamar | Tier | `tier` |

### 3.2 Atributos (Traits)
Seis: **Agilidade, Força, Acurácia (Finesse), Instinto, Presença, Conhecimento**
(`agility, strength, finesse, instinct, presence, knowledge`).
Na criação, distribuir os modificadores **+2, +1, +1, +0, +0, −1** (um de cada).

### 3.3 Dados de Dualidade
- Rolar **2d12**: um é o **dado de Esperança**, outro o **dado de Medo**. Total = soma + atributo + bônus (Experiência, etc.).
- Comparar com a **Dificuldade**.
- Esperança maior → "com Esperança": jogador **ganha 1 Esperança**.
- Medo maior → "com Medo": **mestre ganha 1 Medo**.
- Dados iguais → **crítico**: sucesso automático, ganha 1 Esperança **e** limpa 1 Estresse.
- Gastar Esperança em uma Experiência soma o bônus dela na rolagem.
- O rolador precisa mostrar visualmente qual dado é qual (cores diferentes) e o resultado ("Sucesso com Esperança", "Falha com Medo", "Crítico!").
- **Animação na Esperança** quando ganhar/gastar (o usuário pediu isso explicitamente).

### 3.4 Recursos do personagem
| Recurso | Regra base (conferir) |
|---|---|
| Esperança | Começa com **2**, máximo **6** |
| Estresse | Começa com **6** espaços, máximo **12** |
| PV | Base da **classe** (+ bônus de nível) |
| Evasão | Base da **classe** (+ bônus) |
| Armadura | Valor da armadura equipada = nº de espaços de armadura |
| Limiares | Base da armadura **+ nível do personagem** |
| Proficiência | Começa em **1** |
| Experiências | **2** na criação, cada uma **+2** |
| Ouro | Punhados → Sacolas → Baús (10 → 1). Começa com **1 punhado** |

### 3.5 Dano
Dano recebido comparado aos limiares:
- abaixo do Maior → marca **1 PV**
- ≥ Maior → **2 PV**
- ≥ Grave → **3 PV**
- Pode marcar **1 espaço de Armadura** para reduzir a gravidade em um degrau.
- Quando não tem mais Estresse para marcar e precisaria marcar, marca PV no lugar.
- Todos os PV marcados → **movimento de morte** (escolha do jogador: Desafiar a Morte / Evitar a Morte / Chama de Glória — conferir nomes oficiais em pt).

A ficha deve ter um botão **"Receber dano"**: digita o valor → o sistema calcula quantos PV marcar, oferece usar Armadura, e aplica.

### 3.6 Classes, domínios e subclasses

> **Atualizado:** os dados conferidos com o SRD 2.0 estão em `src/app/core/data/srd/classes.ts` (13 classes). A tabela abaixo é a versão original e está desatualizada.

| Classe | Domínios | Evasão inicial | PV inicial | Subclasses |
|---|---|---|---|---|
| Bardo (Bard) | Graça, Códice | 10 | 5 | Trovador, Artífice das Palavras |
| Druida (Druid) | Sábio, Arcano | 10 | 6 | Guardião dos Elementos, Guardião da Renovação |
| Guardião (Guardian) | Valor, Lâmina | 9 | 7 | Inabalável, Vingança |
| Patrulheiro (Ranger) | Osso, Sábio | 12 | 6 | Vínculo Bestial, Desbravador |
| Ladino (Rogue) | Meia-Noite, Graça | 12 | 6 | Andarilho Noturno, Sindicato |
| Serafim (Seraph) | Esplendor, Valor | 9 | 7 | Portador Divino, Sentinela Alada |
| Feiticeiro (Sorcerer) | Arcano, Meia-Noite | 10 | 6 | Origem Elemental, Origem Primal |
| Guerreiro (Warrior) | Lâmina, Osso | 11 | 6 | Chamado do Bravo, Chamado do Matador |
| Mago (Wizard) | Códice, Esplendor | 11 | 5 | Escola do Conhecimento, Escola da Guerra |

Nomes em pt-BR são provisórios: usar a tradução oficial se existir, senão manter inglês.
Cada classe tem: **atributos sugeridos**, **itens iniciais/escolhas**, **característica de Esperança** (custa 3 Esperança), **características de classe**, **perguntas de história e de vínculo**.

### 3.7 Ancestralidades e Comunidades
- **Ancestralidades (18):** Clank, Drakona, Anão, Elfo, Fada, Fauno, Firbolg, Fungril, Galapa, Gigante, Goblin, Halfling, Humano, Infernis, Katari, Orc, Ribbet, Simiah. Cada uma tem **2 características**. Permitir **ancestralidade mista** (pega 1 característica de cada).
- **Comunidades (9):** Nobreza (Highborne), Saber (Loreborne), Ordem (Orderborne), Serrania (Ridgeborne), Mar (Seaborne), Malandragem (Slyborne), Subterrâneo (Underborne), Andarilho (Wanderborne), Selvagem (Wildborne). Cada uma tem **1 característica**.

### 3.8 Cartas de domínio
- 9 domínios: Arcano, Lâmina, Osso, Códice, Graça, Meia-Noite, Sábio, Esplendor, Valor.
- Cada carta: domínio, nível (1–10), tipo (magia/habilidade/grimório), custo de lembrança (recall), texto.
- Na criação: **2 cartas de nível 1** dos domínios da classe.
- **Mão (loadout): no máximo 5 cartas ativas**; o resto fica no **Cofre**. Trocar fora de descanso custa Estresse igual ao custo de lembrança.

### 3.9 Níveis e evolução
- Níveis **1 a 10**. Patamares: **1** (nv 1), **2** (nv 2–4), **3** (nv 5–7), **4** (nv 8–10).
- **Conquistas de patamar** nos níveis **2, 5 e 8**: nova Experiência +2, +1 Proficiência; nos níveis 5 e 8 limpar as marcas de atributo.
- A cada nível: escolher **2 opções de avanço** da tabela do patamar (ex.: +1 em dois atributos não marcados, +1 PV, +1 Estresse, +1 em duas Experiências, carta de domínio extra, +1 Evasão, carta de subclasse, +1 Proficiência (custa as duas escolhas), multiclasse a partir do patamar 3).
- Depois: **+1 em todos os limiares** e **pegar 1 nova carta de domínio** de nível ≤ ao do personagem.
- O usuário quer **subir de nível como um assistente passo a passo** (wizard), igual à criação.

### 3.10 Descansos
- **Descanso curto** e **descanso longo**: cada um permite escolher movimentos de descanso (recuperar PV, Estresse, Armadura, preparar etc.). Botão na ficha abre um modal de escolha.
- Descanso dá Medo ao mestre (conferir quantidade). Integrar com o painel.

### 3.11 Lado do mestre
- **Medo**: contador de 0 a **12**.
- **Contadores regressivos** (countdowns) com nome e valor, visíveis ou ocultos para a TV.
- **Adversários**: nome, tipo, patamar, Dificuldade, limiares, PV, Estresse, ataque (modificador, alcance, dano), características. Marcar PV/Estresse ao vivo.
- **Ambientes** (opcional, fase tardia).

---

## 4. Funcionalidades

### 4.1 Contas e campanha
- Login com Google.
- Usuário cria **campanha** (vira mestre) e gera **código de convite**.
- Jogador entra com o código → vira membro.
- Um usuário pode ter vários personagens e estar em várias campanhas, mas no uso real é 1 campanha.
- Tela inicial: lista das minhas campanhas → escolher → **seleção de personagem** (cards com retrato, nome, classe, nível).

### 4.2 Criação guiada de personagem (**a parte mais importante**)
Assistente passo a passo, um passo por tela no celular, com barra de progresso, botão voltar e **rascunho salvo automaticamente** (pode fechar e continuar depois).

1. **Classe** — cards com descrição curta, domínios, Evasão/PV. Toque abre detalhes.
2. **Subclasse** — as 2 opções da classe, com a característica fundamental.
3. **Ancestralidade** — lista com busca; opção "mista".
4. **Comunidade**.
5. **Atributos** — distribuir +2, +1, +1, +0, +0, −1. Interface de arrastar/tocar; botão "usar sugestão da classe". Validação: cada valor usado exatamente uma vez.
6. **Valores derivados** — mostra Evasão, PV, Estresse, Esperança calculados (só leitura, explica de onde vem cada número).
7. **Equipamento** — arma(s) primária/secundária e armadura do patamar 1; itens iniciais da classe. Mostra limiares resultantes.
8. **Experiências** — 2 campos de texto livre (+2 cada), com exemplos.
9. **Cartas de domínio** — escolher 2 cartas de nível 1 dos domínios da classe.
10. **História** — nome, pronomes, aparência, retrato (upload), perguntas de história da classe.
11. **Vínculos** — perguntas de vínculo com outros personagens da campanha (mostra os outros PJs).
12. **Revisão** — resumo completo, editar qualquer passo, "Finalizar".

Regras:
- Toda a lógica de validação fica em `core/rules` (funções puras, testadas), não nos componentes.
- O wizard funciona offline-tolerante: salva em Firestore com debounce; se cair a conexão, o cache do Firestore segura.

### 4.3 Ficha do personagem (uso na sessão)
Mobile-first, organizada em **abas** no celular (no tablet/notebook vira colunas):
- **Principal**: nome, nível, classe; **Esperança** (6 bolinhas tocáveis, com animação), **Estresse**, **PV**, **Armadura** (caixinhas tocáveis), Evasão, limiares, Proficiência; botões **Rolar**, **Receber dano**, **Descanso**.
- **Atributos e Experiências**: toque em um atributo → abre o rolador já com o modificador.
- **Cartas**: Mão (máx 5) e Cofre, arrastar para trocar; toque mostra o texto da carta.
- **Equipamento e inventário**: armas, armadura, itens, ouro.
- **Características**: de classe, subclasse, ancestralidade, comunidade, característica de Esperança.
- **Anotações**: notas livres + **anotações por sessão** (cada sessão tem data/número e texto).
- **Histórico de rolagens** (últimas N).

Comportamento:
- Mudanças salvam na hora (otimista) e aparecem em tempo real no painel do mestre.
- Toques grandes (mín. 44px), nada de hover obrigatório.
- Desfazer a última alteração de recurso (toque errado é comum no celular).

### 4.4 Subir de nível (assistente)
Botão "Subir de nível" (o mestre libera ou o jogador aciona). Passos:
1. Conquista de patamar (se nível 2/5/8).
2. Escolher 2 avanços (bloqueia combinações inválidas, ex.: Proficiência custa 2).
3. Limiares +1 (automático, só mostra).
4. Nova carta de domínio.
5. Revisão → aplicar. Guardar o histórico de nível (o que foi escolhido em cada nível) para poder desfazer.

### 4.5 Rolador de dados — **removido** (mesa presencial, ver seção 0)
- Dualidade (2d12 com atributo, Experiência opcional gastando Esperança, bônus/penalidade manual, Vantagem/Desvantagem = +/−d6).
- Dano (ex.: `2d8+3`, com Proficiência definindo nº de dados da arma).
- Rolagem genérica (`XdY+Z`).
- Resultado aplica efeitos automaticamente: +1 Esperança ao jogador, +1 Medo ao mestre, crítico limpa Estresse.
- Rolagens vão para um **log da campanha** visível ao mestre (e opcionalmente na TV).
- Aleatoriedade com `crypto.getRandomValues`.

### 4.6 Painel do mestre (notebook)
- Grade com **todos os PJs** ao vivo: PV, Estresse, Esperança, Armadura, Evasão, limiares, condições.
- Mestre pode editar recursos de qualquer PJ.
- **Medo** grande e fácil de clicar.
- **Contadores regressivos**.
- **Adversários**: biblioteca (criar/editar/duplicar) + "encontro atual" com instâncias (ex.: 3× Goblin, cada um com PV próprio).
- **Log de rolagens** da mesa.
- **Sessões**: iniciar/encerrar sessão (número, data, resumo do mestre). As anotações dos jogadores ficam ligadas à sessão.
- Botão **"Abrir TV"**.

### 4.7 Mapa de combate
- Upload de imagem de mapa; grade quadrada opcional (tamanho ajustável, alinhar com a imagem).
- **Tokens**: PJs (com retrato) e adversários; arrastar; zoom/pan com mouse e pinça no touch.
- Jogador pode mover **só o próprio token**; mestre move tudo.
- Tokens podem ser **ocultos** (só o mestre vê).
- Régua simples / indicação de alcance do Daggerheart (Corpo a corpo, Muito Perto, Perto, Longe, Muito Longe — conferir).
- Estado do mapa sincronizado em tempo real.

### 4.8 Tela de TV
- Rota `/tv/:campaignId`, sem menus, tela cheia, somente leitura.
- Mostra: mapa (sem tokens ocultos), Medo (opcional — o mestre escolhe se a mesa vê), contadores visíveis, última rolagem em destaque, retratos dos PJs com PV/Estresse.
- Abrir via `window.open` do painel **ou** acessar de outro aparelho (smart TV, Chromecast via aba) — por isso a sincronização é via Firestore, não só `BroadcastChannel`.
- Precisa funcionar sem login? → **Sim, via token de TV**: o mestre gera um link `/tv/:campaignId?key=...`. As regras do Firestore permitem leitura de um documento `tvState` público-por-chave. (Alternativa mais simples na primeira versão: TV exige login do mestre.)

---

## 5. Modelo de dados (Firestore)

```
users/{uid}
  displayName, photoURL, createdAt

campaigns/{campaignId}
  name, gmUid, memberUids: string[], inviteCode, createdAt
  fear: number (0–12)
  settings: { showFearOnTv: bool, ... }

campaigns/{campaignId}/characters/{characterId}
  ownerUid, status: 'draft' | 'active' | 'retired'
  name, pronouns, portraitUrl, level, tier
  classId, subclassId, ancestry: { ids: string[], mixed: bool }, communityId
  traits: { agility, strength, finesse, instinct, presence, knowledge }  // número
  traitMarks: string[]          // atributos marcados por avanço
  evasion, proficiency
  hp: { max, marked }, stress: { max, marked }, hope: { max, current }
  armor: { itemId, score, slotsMarked }
  thresholds: { major, severe }
  experiences: [{ name, bonus }]
  cards: [{ id, active }]            // cartas do SRD; active = na mão (máx. 5)
  domainCards: { loadout, vault }     // texto livre p/ cartas fora dos dados
  inventory: { primaryWeapon, secondaryWeapon, items: [...], gold: { handfuls, bags, chests } }
  backstory: { answers: {...}, appearance, ... }, connections: {...}
  levelHistory: [{ level, choices: [...] }]
  notes: string
  updatedAt

campaigns/{campaignId}/characters/{characterId}/sessionNotes/{sessionId}
  text, updatedAt

campaigns/{campaignId}/sessions/{sessionId}
  number, date, gmSummary, active: bool

campaigns/{campaignId}/rolls/{rollId}
  byUid, characterId?, type, dice: [...], total, outcome, createdAt   // limitar/limpar antigos

campaigns/{campaignId}/countdowns/{id}
  name, value, max, visibleOnTv

campaigns/{campaignId}/adversaries/{id}          // biblioteca
campaigns/{campaignId}/encounter/{instanceId}    // instâncias no combate atual
  adversaryId, label, hpMarked, stressMarked, hidden

campaigns/{campaignId}/drafts/{characterId}        // rascunho do guia de criação
campaigns/{campaignId}/cardArt/{cardId}            // arte enviada pela mesa p/ o cabeçalho da carta
  image (data URL ~640px), updatedAt               // arte oficial não pode ser redistribuída (DPCGL 1.5b)

campaigns/{campaignId}/map/state                 // documento único
  imageUrl, grid: { size, offsetX, offsetY, enabled }
  tokens: { [tokenId]: { kind: 'pc'|'adversary', refId, x, y, hidden } }
```

**Dados do jogo** (classes, ancestralidades, comunidades, cartas, armas, armaduras, tabelas de avanço) ficam em **arquivos JSON estáticos** dentro do app (`src/assets/data/*.json` ou `src/app/core/data/*.ts`), tipados, e **não** no Firestore. Isso economiza leituras e facilita versionar.

### 5.1 Regras de segurança (resumo)
- Usuário lê/escreve só o próprio `users/{uid}`.
- Campanha: lê se `uid in memberUids` ou `uid == gmUid`; só o mestre edita campos da campanha (inclusive `fear`).
- Personagem: dono edita o próprio; mestre edita qualquer um da campanha; membros leem todos da campanha.
- Mapa: mestre escreve tudo; jogador só pode alterar `x/y` do token cujo `refId` é personagem dele.
- Escrever regras + testes com o Emulator antes de publicar.

---

## 6. Arquitetura do front-end

```
src/app/
  core/
    auth/            # AuthService, guards (authGuard, gmGuard)
    firebase/        # providers, helpers de conversão Firestore
    data/            # JSON/TS tipados do conteúdo do jogo + loaders
    rules/           # FUNÇÕES PURAS das regras: dice.ts, damage.ts, creation.ts, leveling.ts, rest.ts
    models/          # interfaces/types (Character, Campaign, Adversary...)
  shared/
    ui/              # componentes visuais reutilizáveis (pip-tracker, slot-boxes, card, modal, stepper, dice-display)
    pipes/, directives/
  features/
    campaigns/       # lista, criar, entrar com código
    character-select/
    character-creation/   # wizard, um componente por passo + store do rascunho
    character-sheet/      # abas da ficha
    level-up/
    dice/                 # rolador + log
    gm-panel/
    adversaries/
    map/                  # Konva
    tv/
  app.routes.ts
```

Estado: **signals** em serviços por feature (`CharacterStore`, `CampaignStore`), alimentados por `onSnapshot` convertidos com `toSignal`/`signal`. Sem NgRx a menos que fique realmente necessário.

### 6.1 Rotas
| Rota | Quem | Tela |
|---|---|---|
| `/` | todos | Login pelo nome do personagem (ou `mestre` + PIN) |
| `/ficha/:id` | dono ou mestre | Ficha |
| `/mestre` | mestre | Painel do mestre |
| `/criar` | jogador | Criação guiada (a fazer) |
| `/ficha/:id/nivel` | dono | Subir de nível (a fazer) |
| `/mestre/mapa` | mestre | Mapa com tudo visível (a fazer) |
| `/tv` | mestre | Visão dos jogadores, aberta em popup (a fazer) |

---

## 7. UX e visual
- **Mobile-first** (360px de largura como base). Tablet e notebook são expansão.
- Tema escuro por padrão (mesa à noite), com tema claro opcional.
- Cores da Dualidade: **Esperança = dourado/âmbar**, **Medo = roxo/violeta**. Usar em todo lugar (dados, contadores).
- Animações: ganho/gasto de Esperança (brilho/partícula), rolagem de dados, crítico. Respeitar `prefers-reduced-motion`.
- Feedback tátil (`navigator.vibrate`) opcional em toques de recursos.
- Acessível: contraste AA, labels nos botões de ícone, foco visível.
- Textos da UI em **pt-BR**; centralizar strings para facilitar trocar termos.

---

## 8. Fases de entrega

Reorganizadas em 28/10/2026 para refletir o que já existe.

### ✅ Fase 0 — Fundação (feito)
- Angular 22 + Tailwind + ESLint/Prettier; Firebase (Auth anônimo + Firestore + emuladores); deploy no GitHub Pages via Actions.
- Login pelo nome do personagem; mestre com PIN.

### ✅ Fase 1 — Ficha + Painel básico (feito)
- Ficha manual editável, recursos tocáveis em tempo real, anotações.
- Painel do mestre com todos os PJs (resumido/estendido, popup da ficha) + Medo.

### ✅ Fase 2 — Criação guiada (feito, primeira versão)
- Dados do SRD 2.0 traduzidos (nível 1 / Patamar 1): classes, subclasses (Fundação), ancestralidades, comunidades, domínios, cartas de nível 1, armas e armaduras do Patamar 1, exemplos de Experiência.
- Assistente de 12 passos em `/criar/:id`, com rascunho salvo em `campaigns/nix/drafts/{id}`.
- `core/rules/creation.ts` com testes; regras do Firestore testadas no emulador (`npm run test:rules`).
- **Pronto quando:** alguém que nunca jogou cria um personagem válido sozinho pelo celular. *(validar com os jogadores)*

### Fase 3 — Sessão e evolução (próxima)
- Receber dano (limiares + Armadura), descansos curto/longo, Mão/Cofre com as cartas do SRD.
- Subir de nível (assistente) — exige transcrever cartas de nível 2+ e opções de avanço.
- Adversários e contadores no painel do mestre. Anotações por sessão.

### Fase 4 — Mapa e TV
- Mapa com Konva: tokens, névoa, monstros ocultos; popup "visão dos jogadores" para a TV.

### Fase 5 — Polimento
- PWA, tema claro, desfazer, exportar ficha, retratos (Storage).

## 9. Requisitos não funcionais
- Funcionar bem em Chrome Android e Safari iOS (tablets/celulares dos amigos).
- Plano gratuito do Firebase (Spark) deve bastar: evitar leituras desnecessárias (dados do jogo locais, listeners só onde precisa, limpar log de rolagens antigas).
- Tempo de carga inicial razoável no 4G: lazy loading por feature (`loadComponent`).
- Nenhuma credencial secreta no repositório além da config pública do Firebase.

## 10. Perguntas em aberto
- Existe tradução oficial pt-BR dos termos? Se sim, usar os nomes oficiais.
- Mestre edita a ficha dos jogadores livremente ou só recursos?
- TV com login do mestre ou com link de chave? (Começar com login.)
- Quantidade de conteúdo do SRD a digitar: começar só com nível 1–2 e ir expandindo.