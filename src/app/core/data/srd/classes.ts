import { ClassData } from './types';

// Source: Daggerheart SRD 2.0, "Classes" (pp. 8–31). Translated to pt-BR.
// Only what character creation needs: specialization/mastery features come with level-up.

export const CLASSES: readonly ClassData[] = [
  {
    id: 'assassin',
    name: 'Assassino',
    nameEn: 'Assassin',
    description:
      'Mestres em ferimentos mortais com golpes precisos. Para os assassinos, a morte é uma profissão — muitos a veem como um ofício digno, até sagrado, e alguns entram em guildas para aperfeiçoar a técnica, definir suas crenças e ganhar dinheiro. Alguns destroem qualquer um pelo preço certo; outros seguem códigos morais rígidos sobre quem pode ser alvo.',
    domains: ['blade', 'midnight'],
    evasion: 12,
    hp: 5,
    items: [
      'Uma lista de nomes com vários riscados',
      'Uma lâmina enferrujada gravada com uma insígnia',
    ],
    hopeFeature: {
      name: 'Determinação Mortal',
      nameEn: 'Deadly Determination',
      text: 'Gaste 3 Esperança para limpar 2 Estresse.',
    },
    features: [
      {
        name: 'Marcado para Morrer',
        nameEn: 'Marked for Death',
        text: 'Em um ataque com arma bem-sucedido, você pode marcar 1 Estresse para deixar o alvo Marcado para Morrer. Quando causar dano a um alvo Marcado para Morrer, adicione à rolagem de dano um número de d4 igual ao seu patamar. Só um adversário pode estar Marcado para Morrer por vez; a condição dura até você descansar, o adversário ser derrotado ou o mestre gastar Medo igual ao seu patamar para removê-la.',
      },
      {
        name: 'Entrar e Sair',
        nameEn: 'Get In & Get Out',
        text: 'Gaste 1 Esperança para pedir ao mestre um jeito rápido ou discreto de entrar ou sair de um lugar que você consegue ver. A próxima rolagem que você fizer usando essa informação tem vantagem.',
      },
    ],
    subclasses: [
      {
        id: 'executioners-guild',
        name: 'Guilda dos Executores',
        nameEn: 'Executioners Guild',
        pitch: 'Para abater seus alvos com precisão letal.',
        spellcastTrait: 'agility',
        foundation: [
          {
            name: 'Primeiro Golpe',
            nameEn: 'First Strike',
            text: 'Na primeira vez em uma cena em que você acertar um ataque, cause dano dobrado.',
          },
          {
            name: 'Emboscada',
            nameEn: 'Ambush',
            text: 'Seu “Marcado para Morrer” usa d6 em vez de d4.',
          },
        ],
      },
      {
        id: 'poisoners-guild',
        name: 'Guilda dos Envenenadores',
        nameEn: 'Poisoners Guild',
        pitch: 'Para debilitar seus alvos com aflições punitivas.',
        spellcastTrait: 'knowledge',
        foundation: [
          {
            name: 'Misturas Tóxicas',
            nameEn: 'Toxic Concoctions',
            text: 'Marque 1 Estresse para colocar 1d4+1 marcadores nesta carta. Ao acertar um ataque com arma, você pode gastar um marcador para afligir o alvo com um veneno que conhece:\n• Pétala Fantasma: o alvo fica temporariamente Vulnerável.\n• Esporo da Cova: o alvo também marca 1 Estresse.\n• Erva-Sanguessuga: você causa 1d6 de dano extra neste ataque.\nNo descanso longo, remova os marcadores não usados.',
          },
        ],
      },
    ],
    backgroundQuestions: [
      'Você já matou alguém próximo de você. O que aconteceu e como isso te mudou?',
      'Que organização te treinou na arte de matar e como você se tornou membro?',
      'Ao longo da sua carreira, um alvo sempre escapou. Quem é e como ele escorregou por entre seus dedos?',
    ],
    connectionQuestions: [
      'Eu já matei alguém por você. Quem era?',
      'Como você me salvou quando eu estava à beira da morte? O que eu prometi em troca?',
      'Que segredo sobre mim eu te contei e como isso mudou a forma como você me vê?',
    ],
  },
  {
    id: 'bard',
    name: 'Bardo',
    nameEn: 'Bard',
    description:
      'As pessoas mais carismáticas de todos os reinos. Mestres da cativação, especializados em cantar, tocar instrumentos, contar histórias ou fazer piada. Prosperam em situações sociais e são os mais propensos a unir as pessoas — mas um bardo de mau humor pode, com a mesma facilidade, desmanchar um grupo.',
    domains: ['grace', 'codex'],
    evasion: 10,
    hp: 5,
    items: ['Um romance', 'Uma carta nunca aberta'],
    hopeFeature: {
      name: 'Fazer uma Cena',
      nameEn: 'Make a Scene',
      text: 'Gaste 3 Esperança para Distrair temporariamente um alvo a até Perto, dando −2 de penalidade à Dificuldade dele.',
    },
    features: [
      {
        name: 'Inspirar',
        nameEn: 'Rally',
        text: 'Uma vez por sessão, descreva como você inspira o grupo e dê a você e a cada aliado um Dado de Inspiração (d6 no nível 1, d8 no nível 5). Um personagem pode rolá-lo e somar o resultado a uma rolagem de ação, de reação ou de dano, ou limpar Estresse igual ao resultado. No fim da sessão, os Dados de Inspiração não usados somem.',
      },
    ],
    subclasses: [
      {
        id: 'troubadour',
        name: 'Trovador',
        nameEn: 'Troubadour',
        pitch: 'Para tocar música e fortalecer os aliados.',
        spellcastTrait: 'presence',
        foundation: [
          {
            name: 'Artista Talentoso',
            nameEn: 'Gifted Performer',
            text: 'Você pode tocar três tipos de música, uma vez cada por descanso longo; descreva a apresentação para obter o efeito:\n• Canção Relaxante: você e todos os aliados a até Perto limpam 1 PV.\n• Canção Épica: um alvo a até Perto fica temporariamente Vulnerável.\n• Canção Comovente: você e todos os aliados a até Perto ganham 1 Esperança.',
          },
        ],
      },
      {
        id: 'wordsmith',
        name: 'Artífice das Palavras',
        nameEn: 'Wordsmith',
        pitch: 'Para usar jogos de palavras e cativar multidões.',
        spellcastTrait: 'presence',
        foundation: [
          {
            name: 'Discurso Inspirador',
            nameEn: 'Rousing Speech',
            text: 'Uma vez por descanso longo, faça um discurso sincero e inspirador. Todos os aliados a até Longe limpam 2 Estresse.',
          },
          {
            name: 'Coração de Poeta',
            nameEn: 'Heart of a Poet',
            text: 'Depois de fazer uma rolagem de ação para impressionar, persuadir ou ofender alguém, você pode gastar 1 Esperança para somar 1d4 à rolagem.',
          },
        ],
      },
    ],
    backgroundQuestions: [
      'Quem da sua comunidade te ensinou a ter tanta confiança em si?',
      'Você já se apaixonou. Por quem, e como essa pessoa te machucou?',
      'Você sempre admirou outro bardo. Quem é e por que você o idolatra?',
    ],
    connectionQuestions: [
      'O que te fez perceber que seríamos tão bons amigos?',
      'O que eu faço que te irrita?',
      'Por que você segura minha mão à noite?',
    ],
  },
  {
    id: 'brawler',
    name: 'Lutador',
    nameEn: 'Brawler',
    description:
      'Especialistas em combate desarmado que transformam o corpo numa arma letal. Seja por treino formal, com um mentor ou briga a briga, desenvolvem corpo e mente para agir como um só. Buscam novos desafios e parceiros de treino para manter e ampliar suas técnicas — e muitas vezes fazem mais de mãos nuas do que um soldado com espada.',
    domains: ['valor', 'bone'],
    evasion: 10,
    hp: 6,
    items: ['Faixas de mão de um mentor', 'Um livro sobre seu hobby secreto'],
    hopeFeature: {
      name: 'Encarar',
      nameEn: 'Square Up',
      text: 'Gaste 3 Esperança para intimidar um alvo a até Perto, deixando-o temporariamente Vulnerável.',
    },
    features: [
      {
        name: 'Eu Sou a Arma',
        nameEn: 'I Am the Weapon',
        text: 'Seus ataques desarmados são tão fortes quanto uma lâmina. Enquanto não tiver outra arma ativa, você tem equipada a arma primária Golpe de Lutador: usa um atributo à sua escolha, alcance Corpo a corpo, dano d8+d6 físico com sua Proficiência (os dois dados escalam). Enquanto ela estiver ativa, você ganha +1 de Evasão.',
      },
      {
        name: 'Golpe em Combo',
        nameEn: 'Combo Strike',
        text: 'Depois de rolar o dano de um ataque Corpo a corpo bem-sucedido, você pode marcar 1 Estresse para iniciar um combo: role seu Dado de Combo e continue rolando até um resultado ser menor que o anterior. Cause dano extra igual à soma de todos os resultados (que não podem ser modificados). O Dado de Combo começa em d4 e pode subir um passo por patamar como opção de avanço.',
      },
    ],
    subclasses: [
      {
        id: 'juggernaut',
        name: 'Colosso',
        nameEn: 'Juggernaut',
        pitch: 'Para pulverizar os oponentes com golpes esmagadores.',
        foundation: [
          {
            name: 'Robusto',
            nameEn: 'Rugged',
            text: 'Ganhe +3 permanente no seu limiar de dano Grave.',
          },
          {
            name: 'Sobrepujar',
            nameEn: 'Overwhelm',
            text: 'Ao acertar um ataque, você pode gastar 1 Esperança para arremessar o alvo a até Perto ou forçá-lo a marcar 1 Estresse.',
          },
        ],
        mods: { severe: 3 },
      },
      {
        id: 'martial-artist',
        name: 'Artista Marcial',
        nameEn: 'Martial Artist',
        pitch: 'Para usar vários estilos de luta e eliminar os inimigos.',
        foundation: [
          {
            name: 'Lutador de Posturas',
            nameEn: 'Stance Fighter',
            text: 'Você canaliza sua determinação para assumir posturas marciais com benefícios especiais em combate. Escolha duas posturas do Patamar 1; a cada nível, escolha mais uma do seu patamar ou abaixo.\nFoco: uma vez por descanso, num momento de calma, limpe seu Foco e role d6 iguais ao seu Instinto; ganhe Foco igual ao maior resultado (máximo 6). Gaste 1 Foco para assumir uma postura conhecida; só uma fica ativa por vez, e você sai dela ao receber dano Grave, marcar o último PV ou no fim da cena.',
          },
        ],
      },
    ],
    backgroundQuestions: [
      'Onde você passou sua juventude que te ensinou, direta ou indiretamente, a lutar do jeito que luta?',
      'Que organização jurou te matar à primeira vista, e o que você fez para despertar essa ira?',
      'Para quem você perdeu uma luta recentemente e está desesperado por uma revanche?',
    ],
    connectionQuestions: [
      'Qual é uma coisa de que nós dois temos medo?',
      'Em que eu confio em você durante nossas viagens? Como você se sente sobre isso?',
      'Ainda não te perdoei por algo que você me disse. O que foi e por que você disse?',
    ],
    choices: [{ kind: 'stances', subclassId: 'martial-artist' }],
  },
  {
    id: 'druid',
    name: 'Druida',
    nameEn: 'Druid',
    description:
      'Ser druida é mais que uma ocupação: é um chamado para quem quer aprender com a magia da natureza selvagem e protegê-la. Um druida gentil cultivando plantas pode ser subestimado, mas os que canalizam as forças indomadas da natureza são aterrorizantes. Com anos de estudo, aprendem a se transformar em feras e moldar a própria natureza.',
    domains: ['sage', 'arcana'],
    evasion: 10,
    hp: 6,
    items: ['Uma bolsinha de pedras e ossos', 'Um pingente estranho achado na terra'],
    hopeFeature: {
      name: 'Evolução',
      nameEn: 'Evolution',
      text: 'Gaste 3 Esperança para assumir uma Forma de Fera sem marcar Estresse. Ao fazer isso, escolha um atributo para ganhar +1 até sair dessa forma.',
    },
    features: [
      {
        name: 'Forma de Fera',
        nameEn: 'Beastform',
        text: 'Marque 1 Estresse para se transformar magicamente numa criatura do seu patamar ou abaixo da lista de Formas de Fera. Você pode sair da forma quando quiser. Transformado, não usa armas nem conjura magias de cartas de domínio, mas pode usar outras características e falar normalmente; ganha as características da forma, soma o bônus de Evasão dela e usa o atributo indicado para atacar. Sua armadura vira parte do corpo (Espaços de Armadura marcados continuam marcados). Se marcar seu último PV, você sai da forma automaticamente.',
      },
      {
        name: 'Toque Selvagem',
        nameEn: 'Wildtouch',
        text: 'Você pode criar à vontade efeitos sutis e inofensivos ligados à natureza — fazer uma flor crescer rápido, invocar uma brisa leve ou acender uma fogueira.',
      },
    ],
    subclasses: [
      {
        id: 'warden-of-the-elements',
        name: 'Guardião dos Elementos',
        nameEn: 'Warden of the Elements',
        pitch: 'Para encarnar os elementos naturais da natureza selvagem.',
        spellcastTrait: 'instinct',
        foundation: [
          {
            name: 'Encarnação Elemental',
            nameEn: 'Elemental Incarnation',
            text: 'Marque 1 Estresse para Canalizar um elemento até receber dano Grave ou até seu próximo descanso:\n• Fogo: quando um adversário Corpo a corpo te causar dano, ele sofre 1d10 de dano mágico.\n• Terra: ganhe bônus nos limiares de dano igual à sua Proficiência.\n• Água: quando você causar dano a um adversário Corpo a corpo, todos os outros adversários a até Muito Perto marcam 1 Estresse.\n• Ar: você pode flutuar, ganhando vantagem em rolagens de Agilidade.',
          },
        ],
      },
      {
        id: 'warden-of-renewal',
        name: 'Guardião da Renovação',
        nameEn: 'Warden of Renewal',
        pitch: 'Para usar magia poderosa e curar o grupo.',
        spellcastTrait: 'instinct',
        foundation: [
          {
            name: 'Clareza da Natureza',
            nameEn: 'Clarity of Nature',
            text: 'Uma vez por descanso longo, crie um espaço de serenidade natural a até Perto. Quem passar alguns minutos descansando ali limpa Estresse igual ao seu Instinto, distribuído como você quiser entre você e os aliados.',
          },
          {
            name: 'Regeneração',
            nameEn: 'Regeneration',
            text: 'Toque uma criatura e gaste 3 Esperança. Ela limpa 1d4 PV.',
          },
        ],
      },
    ],
    backgroundQuestions: [
      'Por que a comunidade onde você cresceu dependia tanto da natureza e de suas criaturas?',
      'Qual foi o primeiro animal selvagem com quem você criou um vínculo? Por que esse vínculo acabou?',
      'Quem está tentando te caçar? O que quer de você?',
    ],
    connectionQuestions: [
      'O que você me confidenciou que me faz pular no perigo por você toda vez?',
      'Com que animal eu digo que você se parece?',
      'Que apelido carinhoso você me deu?',
    ],
  },
  {
    id: 'guardian',
    name: 'Guardião',
    nameEn: 'Guardian',
    description:
      'O título de guardião abrange várias profissões marciais e fala mais da bússola moral e da firmeza inabalável do que do jeito de lutar. Seguem mais os poucos de quem realmente gostam do que qualquer causa. Lutam com ferocidade mesmo contra probabilidades esmagadoras — e ai de quem ferir um aliado de um guardião.',
    domains: ['valor', 'blade'],
    evasion: 9,
    hp: 7,
    items: ['Um totem do seu mentor', 'Uma chave secreta'],
    hopeFeature: {
      name: 'Linha de Frente',
      nameEn: 'Frontline Tank',
      text: 'Gaste 3 Esperança para limpar 2 Espaços de Armadura.',
    },
    features: [
      {
        name: 'Imparável',
        nameEn: 'Unstoppable',
        text: 'Uma vez por descanso longo, você pode ficar Imparável e ganhar um Dado Imparável (d4 no nível 1, d6 no nível 5), começando com o 1 virado para cima. Depois de uma rolagem de dano que faça o alvo marcar 1 ou mais PV, aumente o valor do dado em 1. Quando ele passaria do máximo ou a cena terminar, remova o dado e saia do estado. Enquanto Imparável:\n• Você reduz a gravidade de dano físico em um limiar (Grave→Maior, Maior→Menor, Menor→nenhum).\n• Você soma o valor atual do Dado Imparável às rolagens de dano.\n• Você não pode ficar Imobilizado nem Vulnerável.',
      },
    ],
    subclasses: [
      {
        id: 'stalwart',
        name: 'Inabalável',
        nameEn: 'Stalwart',
        pitch: 'Para aguentar golpes pesados e continuar lutando.',
        foundation: [
          {
            name: 'Firme',
            nameEn: 'Unwavering',
            text: 'Ganhe +1 permanente nos seus limiares de dano.',
          },
          {
            name: 'Vontade de Ferro',
            nameEn: 'Iron Will',
            text: 'Ao receber dano físico, você pode marcar um Espaço de Armadura adicional para reduzir a gravidade.',
          },
        ],
        mods: { thresholds: 1 },
      },
      {
        id: 'vengeance',
        name: 'Vingança',
        nameEn: 'Vengeance',
        pitch: 'Para abater inimigos que ferem você ou seus aliados.',
        foundation: [
          {
            name: 'À Vontade',
            nameEn: 'At Ease',
            text: 'Ganhe um espaço de Estresse adicional.',
          },
          {
            name: 'Revanche',
            nameEn: 'Revenge',
            text: 'Quando um adversário Corpo a corpo acertar um ataque em você, você pode marcar 2 Estresse para forçar o atacante a marcar 1 PV.',
          },
        ],
        mods: { stress: 1 },
      },
    ],
    backgroundQuestions: [
      'Quem da sua comunidade você não conseguiu proteger, e por que ainda pensa nessa pessoa?',
      'Você foi encarregado de proteger algo importante e entregá-lo num lugar perigoso. O que é e para onde precisa ir?',
      'Você considera um aspecto seu uma fraqueza. Qual é e como isso te afetou?',
    ],
    connectionQuestions: [
      'Como eu salvei sua vida na primeira vez que nos encontramos?',
      'Que pequeno presente você me deu que você percebe que eu sempre carrego comigo?',
      'Que mentira você me contou sobre si que eu acredito totalmente?',
    ],
  },
  {
    id: 'ranger',
    name: 'Patrulheiro',
    nameEn: 'Ranger',
    description:
      'Caçadores muito habilidosos que raramente emprestam suas habilidades a um exército. Com domínio do corpo e profundo conhecimento da natureza, tornam-se táticos astutos que perseguem a presa com paciência. Muitos lutam ao lado de um companheiro animal com quem criaram um vínculo espiritual, e são tão capazes de prender o inimigo numa armadilha quanto de atacá-lo de frente.',
    domains: ['bone', 'sage'],
    evasion: 12,
    hp: 6,
    items: ['Um troféu da sua primeira caçada', 'Uma bússola aparentemente quebrada'],
    hopeFeature: {
      name: 'Segurá-los',
      nameEn: 'Hold Them Off',
      text: 'Gaste 3 Esperança ao acertar um ataque com arma para usar a mesma rolagem contra dois adversários adicionais dentro do alcance.',
    },
    features: [
      {
        name: 'Foco do Patrulheiro',
        nameEn: "Ranger's Focus",
        text: 'Gaste 1 Esperança e faça um ataque. Se acertar, cause o dano normal e o alvo vira temporariamente seu Foco. Contra seu Foco:\n• Você sabe exatamente em que direção ele está.\n• Quando você causar dano a ele, ele marca 1 Estresse.\n• Se errar um ataque contra ele, você pode encerrar o Foco para rolar de novo os Dados de Dualidade.',
      },
    ],
    subclasses: [
      {
        id: 'beastbound',
        name: 'Vínculo Bestial',
        nameEn: 'Beastbound',
        pitch: 'Para criar um vínculo profundo com um aliado animal.',
        spellcastTrait: 'agility',
        foundation: [
          {
            name: 'Companheiro',
            nameEn: 'Companion',
            text: 'Você tem um companheiro animal à sua escolha (com aprovação do mestre) que fica ao seu lado a menos que você mande o contrário. Ele começa com Evasão 10, duas Experiências de +2, dano d6 Corpo a corpo (físico ou mágico, à sua escolha). Faça uma rolagem de Conjuração para comandá-lo; ao receber dano, ele marca Estresse. Quando você subir de nível, escolha também uma melhoria para ele.',
          },
        ],
      },
      {
        id: 'wayfinder',
        name: 'Desbravador',
        nameEn: 'Wayfinder',
        pitch: 'Para caçar a presa e atacar com força mortal.',
        spellcastTrait: 'agility',
        foundation: [
          {
            name: 'Predador Implacável',
            nameEn: 'Ruthless Predator',
            text: 'Ao fazer uma rolagem de dano, você pode marcar 1 Estresse para ganhar +1 de Proficiência. Além disso, quando causar dano Grave a um adversário, ele marca 1 Estresse.',
          },
          {
            name: 'Caminho Adiante',
            nameEn: 'Path Forward',
            text: 'Ao viajar para um lugar onde já esteve, ou levando um objeto que já esteve lá, você identifica o caminho mais curto e direto até o destino.',
          },
        ],
      },
    ],
    backgroundQuestions: [
      'Uma criatura terrível feriu sua comunidade e você jurou caçá-la. O que é e que rastro ou sinal único ela deixa?',
      'Sua primeira caçada quase te matou também. O que era, e que parte de você nunca mais foi a mesma?',
      'Você já viajou por muitas terras perigosas, mas qual é o único lugar aonde você se recusa a ir?',
    ],
    connectionQuestions: [
      'Que competição amigável a gente tem?',
      'Por que você age diferente quando estamos sozinhos do que quando há outras pessoas por perto?',
      'Que ameaça você me pediu para vigiar, e por que isso te preocupa?',
    ],
    choices: [{ kind: 'companion', subclassId: 'beastbound' }],
  },
  {
    id: 'rogue',
    name: 'Ladino',
    nameEn: 'Rogue',
    description:
      'Malandros na atitude e na prática. Conhecidos como mentirosos e ladrões, os melhores se movem pelo mundo anonimamente, usando a inteligência e as lâminas para enganar inimigos com manipulação social, arrombamentos ou golpes baixos. Dominam sombras e movimento e costumam fundar guildas — provando que existe honra entre ladrões para quem sabe onde procurar.',
    domains: ['midnight', 'grace'],
    evasion: 12,
    hp: 6,
    items: ['Um kit de falsificação', 'Um gancho de escalada'],
    hopeFeature: {
      name: 'Esquiva do Ladino',
      nameEn: "Rogue's Dodge",
      text: 'Gaste 3 Esperança para ganhar +2 de Evasão até a próxima vez que um ataque te acertar. Fora isso, o bônus dura até o próximo descanso.',
    },
    features: [
      {
        name: 'Encoberto',
        nameEn: 'Cloaked',
        text: 'Sempre que você ficaria Escondido, fica Encoberto. Além dos benefícios de Escondido, enquanto Encoberto você continua sem ser visto se estiver parado quando um adversário se move para onde normalmente te veria. Depois de atacar ou terminar um movimento na linha de visão de um adversário, deixa de estar Encoberto.',
      },
      {
        name: 'Ataque Furtivo',
        nameEn: 'Sneak Attack',
        text: 'Ao acertar um ataque enquanto Encoberto, ou com um aliado Corpo a corpo do alvo, adicione à rolagem de dano um número de d6 igual ao seu patamar (nível 1: patamar 1; níveis 2–4: 2; 5–7: 3; 8–10: 4).',
      },
    ],
    subclasses: [
      {
        id: 'nightwalker',
        name: 'Andarilho Noturno',
        nameEn: 'Nightwalker',
        pitch: 'Para manipular sombras e se mover pelo ambiente.',
        spellcastTrait: 'finesse',
        foundation: [
          {
            name: 'Passo Sombrio',
            nameEn: 'Shadow Stepper',
            text: 'Você pode se mover de sombra em sombra. Ao entrar numa área escura ou na sombra de uma criatura ou objeto, marque 1 Estresse para sumir e reaparecer dentro de outra sombra a até Longe. Ao reaparecer, você está Encoberto.',
          },
        ],
      },
      {
        id: 'syndicate',
        name: 'Sindicato',
        nameEn: 'Syndicate',
        pitch: 'Para ter uma rede de contatos em todo lugar.',
        spellcastTrait: 'finesse',
        foundation: [
          {
            name: 'Bem Relacionado',
            nameEn: 'Well-Connected',
            text: 'Ao chegar a uma cidade ou ambiente importante, você conhece alguém que mora ali. Dê um nome, diga como acha que a pessoa pode ser útil e escolha um fato:\n• Me deve um favor, mas vai ser difícil de achar.\n• Vai pedir algo em troca.\n• Está sempre em grandes apuros.\n• Já fomos um casal. É uma longa história.\n• Não nos separamos em bons termos.',
          },
        ],
      },
    ],
    backgroundQuestions: [
      'O que você foi pego fazendo que te fez ser exilado da sua comunidade?',
      'Você tinha outra vida e tentou deixá-la para trás. Quem do seu passado ainda te persegue?',
      'De quem do seu passado foi mais triste se despedir?',
    ],
    connectionQuestions: [
      'O que eu te convenci a fazer recentemente que colocou nós dois em encrenca?',
      'O que eu descobri sobre o seu passado e guardo em segredo dos outros?',
      'Quem você conhece do meu passado, e como essa pessoa influenciou o que você sente por mim?',
    ],
  },
  {
    id: 'seraph',
    name: 'Serafim',
    nameEn: 'Seraph',
    description:
      'Guerreiros e curandeiros divinos imbuídos de propósito sagrado. Como há muitas divindades nos reinos, há muitos tipos de serafins, cuja ética segue os objetivos do seu deus: defender os fracos, buscar vingança, proteger uma terra ou artefato, sustentar uma fé. É melhor ser aliado de um serafim do que inimigo.',
    domains: ['splendor', 'valor'],
    evasion: 9,
    hp: 7,
    items: ['Um embrulho de oferendas', 'Um símbolo do seu deus'],
    hopeFeature: {
      name: 'Suporte de Vida',
      nameEn: 'Life Support',
      text: 'Gaste 3 Esperança para limpar 1 PV de um aliado a até Perto.',
    },
    features: [
      {
        name: 'Dados de Oração',
        nameEn: 'Prayer Dice',
        text: 'No início de cada sessão, role um número de d4 igual ao atributo de Conjuração da sua subclasse e deixe-os na ficha. Você pode gastar Dados de Oração para ajudar você ou um aliado a até Longe: usar o valor para reduzir dano recebido, somar ao resultado de uma rolagem depois de feita ou ganhar Esperança igual ao valor. No fim da sessão, os não usados somem.',
      },
    ],
    subclasses: [
      {
        id: 'divine-wielder',
        name: 'Portador Divino',
        nameEn: 'Divine Wielder',
        pitch: 'Para dominar o campo de batalha com uma arma lendária.',
        spellcastTrait: 'strength',
        foundation: [
          {
            name: 'Arma Espiritual',
            nameEn: 'Spirit Weapon',
            text: 'Com uma arma equipada de alcance Corpo a corpo ou Muito Perto, ela pode voar da sua mão para atacar um adversário a até Perto e voltar. Você pode marcar 1 Estresse para atingir um adversário adicional no alcance com a mesma rolagem.',
          },
          {
            name: 'Toque Poupador',
            nameEn: 'Sparing Touch',
            text: 'Uma vez por descanso longo, toque uma criatura e limpe 2 PV ou 2 Estresse dela.',
          },
        ],
      },
      {
        id: 'winged-sentinel',
        name: 'Sentinela Alada',
        nameEn: 'Winged Sentinel',
        pitch: 'Para alçar voo e desferir golpes esmagadores dos céus.',
        spellcastTrait: 'strength',
        foundation: [
          {
            name: 'Asas de Luz',
            nameEn: 'Wings of Light',
            text: 'Você pode voar. Voando, você pode:\n• Marcar 1 Estresse para pegar e carregar outra criatura voluntária do seu tamanho ou menor.\n• Gastar 1 Esperança para causar 1d8 de dano extra num ataque bem-sucedido.',
          },
        ],
      },
    ],
    backgroundQuestions: [
      'A que deus você se dedicou? Que feito incrível ele realizou por você num momento de desespero?',
      'Como sua aparência mudou depois de fazer o juramento?',
      'De que jeito estranho ou único você se comunica com seu deus?',
    ],
    connectionQuestions: [
      'Que promessa você me fez concordar em cumprir caso você morra em batalha?',
      'Por que você me faz tantas perguntas sobre meu deus?',
      'Você me pediu para proteger um membro do grupo acima de todos, até de você. Quem é e por quê?',
    ],
  },
  {
    id: 'sorcerer',
    name: 'Feiticeiro',
    nameEn: 'Sorcerer',
    description:
      'Nem todo usuário de magia inata decide aperfeiçoá-la, mas os que o fazem podem se tornar feiticeiros poderosos. O dom passa por famílias, mesmo quando elas não sabem ou não querem praticá-lo. Ser um feiticeiro formidável não é adquirir poder, mas aprender a cultivar e controlar o poder que já se tem — a magia de um feiticeiro indisciplinado é muito perigosa.',
    domains: ['arcana', 'midnight'],
    evasion: 10,
    hp: 6,
    items: ['Um orbe sussurrante', 'Uma herança de família'],
    hopeFeature: {
      name: 'Magia Volátil',
      nameEn: 'Volatile Magic',
      text: 'Gaste 3 Esperança para rolar de novo quantos dados de dano quiser num ataque que cause dano mágico.',
    },
    features: [
      {
        name: 'Sentido Arcano',
        nameEn: 'Arcane Sense',
        text: 'Você sente a presença de pessoas e objetos mágicos a até Perto.',
      },
      {
        name: 'Ilusão Menor',
        nameEn: 'Minor Illusion',
        text: 'Faça uma rolagem de Conjuração (10). Em sucesso, crie uma pequena ilusão visual não maior que você a até Perto. Ela convence quem estiver a Perto ou mais longe.',
      },
      {
        name: 'Canalizar Poder Bruto',
        nameEn: 'Channel Raw Power',
        text: 'Uma vez por descanso longo, coloque uma carta de domínio da sua mão no cofre e escolha:\n• Ganhar Esperança igual ao nível da carta.\n• Potencializar uma magia de dano, ganhando bônus na rolagem de dano igual ao dobro do nível da carta.',
      },
    ],
    subclasses: [
      {
        id: 'elemental-origin',
        name: 'Origem Elemental',
        nameEn: 'Elemental Origin',
        pitch: 'Para canalizar magia bruta e assumir a forma de um elemento.',
        spellcastTrait: 'instinct',
        foundation: [
          {
            name: 'Elementalista',
            nameEn: 'Elementalist',
            text: 'Escolha um elemento na criação: ar, terra, fogo, relâmpago ou água. Você pode moldá-lo em efeitos inofensivos. Além disso, gaste 1 Esperança e descreva como seu controle sobre o elemento ajuda uma rolagem de ação que vai fazer; então ganhe +2 na rolagem ou +3 no dano dela.',
          },
        ],
      },
      {
        id: 'primal-origin',
        name: 'Origem Primal',
        nameEn: 'Primal Origin',
        pitch: 'Para ampliar a versatilidade das suas magias de formas poderosas.',
        spellcastTrait: 'instinct',
        foundation: [
          {
            name: 'Manipular Magia',
            nameEn: 'Manipulate Magic',
            text: 'Depois de conjurar uma magia ou atacar com uma arma de dano mágico, você pode marcar 1 Estresse para:\n• Aumentar o alcance em um passo.\n• Ganhar +2 no resultado da rolagem de ação.\n• Dobrar um dado de dano à sua escolha.\n• Atingir um alvo adicional dentro do alcance.',
          },
        ],
      },
    ],
    backgroundQuestions: [
      'O que você fez que deixou as pessoas da sua comunidade desconfiadas de você?',
      'Que mentor te ensinou a controlar sua magia indomada, e por que ele não pode mais te guiar?',
      'Você tem um medo profundo que esconde de todos. Qual é e por que te assusta?',
    ],
    connectionQuestions: [
      'Por que você confia tanto em mim?',
      'O que eu fiz que te deixa cauteloso perto de mim?',
      'Por que mantemos nosso passado em comum em segredo?',
    ],
    choices: [{ kind: 'element', subclassId: 'elemental-origin' }],
  },
  {
    id: 'warlock',
    name: 'Pactário',
    nameEn: 'Warlock',
    description:
      'Quem trocou a vida — ou talvez a alma — com um patrono de outro mundo em troca de poder incrível. Muitas vezes chegaram a um ponto de desespero: proteger a si ou a alguém amado, ajudar a comunidade, vingar-se ou subir de status. Os patronos podem ser deuses, espíritos, demônios ou seres desconhecidos, e os que colecionam almas raramente são benevolentes. Apesar da magia aterrorizante, o pactário pode descobrir que outra coisa está puxando suas cordas.',
    domains: ['dread', 'grace'],
    evasion: 11,
    hp: 5,
    items: ['Um entalhe que simboliza seu patrono', 'Um anel que você não consegue tirar'],
    hopeFeature: {
      name: 'Bênção do Patrono',
      nameEn: "Patron's Boon",
      text: 'Ao falhar numa rolagem, você pode gastar 3 Esperança para rolar de novo com vantagem.',
    },
    features: [
      {
        name: 'Pacto do Patrono',
        nameEn: "Patron's Pact",
        text: 'Você se comprometeu com uma entidade sobrenatural — um deus, fada ou demônio — em troca de poder. Escreva o nome dela e defina com o mestre a esfera de influência (Natureza, Caos, Sabedoria, Travessura, Amor, Guerra, Justiça, Morte…). Antes de uma rolagem de ação ligada a essa esfera, você pode gastar 1 Favor para pedir ajuda, rolando o Dado do Patrono (d6, vira d8 no nível 5) e somando ao total.',
      },
      {
        name: 'Favor',
        nameEn: 'Favor',
        text: 'Você começa com 3 Favores (máximo 6). Pode usar uma ação de descanso para prestar tributo ao patrono e ganhar Favor igual ao seu atributo de Conjuração. Além disso, ao ter sucesso com Esperança numa rolagem de ação, pode ganhar 1 Favor em vez de 1 Esperança.',
      },
    ],
    subclasses: [
      {
        id: 'pact-of-the-endless',
        name: 'Pacto do Infinito',
        nameEn: 'Pact of the Endless',
        pitch: 'Para resistir aos inimigos e escapar da morte.',
        spellcastTrait: 'presence',
        foundation: [
          {
            name: 'Manto do Patrono',
            nameEn: "Patron's Mantle",
            text: 'Gaste 1 Favor para se cobrir com um aspecto aterrorizante do patrono até receber dano Grave ou a cena acabar. Enquanto ativo, ganhe bônus nos limiares de dano igual ao seu patamar e vantagem em rolagens de ação para intimidar.',
          },
          {
            name: 'Abraço Imortal',
            nameEn: 'Deathless Embrace',
            text: 'Uma vez por descanso, gaste quantos Favores quiser para rolar o mesmo número de Dados do Patrono. Para cada resultado 4 ou maior, limpe 1 PV.',
          },
        ],
      },
      {
        id: 'pact-of-the-wrathful',
        name: 'Pacto do Furioso',
        nameEn: 'Pact of the Wrathful',
        pitch: 'Para destruir quem age contra você.',
        spellcastTrait: 'presence',
        foundation: [
          {
            name: 'Fúria do Patrono',
            nameEn: "Patron's Fury",
            text: 'Gaste 1 Favor para imbuir seus ataques com o poder do patrono até causar dano Grave ou a cena acabar. Enquanto ativo, ao rolar dano, role também Dados do Patrono iguais ao seu patamar e some ao dano.',
          },
          {
            name: 'Vingança Mortal',
            nameEn: 'Deadly Vengeance',
            text: 'Quando marcar PV por causa de um ataque, você pode gastar 1 Favor para rolar Dados do Patrono iguais aos PV marcados. Para cada resultado 4 ou maior, o atacante marca 1 PV.',
          },
        ],
      },
    ],
    backgroundQuestions: [
      'Quem da sua comunidade te rejeitou depois que você fez o pacto?',
      'Que situação desesperadora te levou a entregar sua vida ao patrono?',
      'Seu patrono te deu uma tarefa que você precisa cumprir acima de tudo. Qual é, e por que ela te preocupa?',
    ],
    connectionQuestions: [
      'Por que você acha que eu confio em você sobre o que meu patrono diz e faz?',
      'Nossa relação mudou depois que você me viu prestar tributo ao meu patrono. O que você viu e como isso te afetou?',
      'Uma vez fiz algo muito tolo, e você nunca me deixa esquecer. O que foi?',
    ],
    choices: [{ kind: 'patron' }],
  },
  {
    id: 'warrior',
    name: 'Guerreiro',
    nameEn: 'Warrior',
    description:
      'Ser guerreiro exige anos, às vezes uma vida inteira, de treino e dedicação às armas e à violência. Além da força, entendem a importância de um corpo ágil e uma mente rápida, o que os torna dos lutadores mais procurados dos reinos. Trabalham em exércitos, bandos mercenários ou guardas reais, e têm uma arma favorita — ficar entre um guerreiro e sua lâmina é um erro grave.',
    domains: ['blade', 'bone'],
    evasion: 11,
    hp: 6,
    items: ['O desenho de alguém que você ama', 'Uma pedra de amolar'],
    hopeFeature: {
      name: 'Sem Piedade',
      nameEn: 'No Mercy',
      text: 'Gaste 3 Esperança para ganhar +1 nas rolagens de ataque até o próximo descanso.',
    },
    features: [
      {
        name: 'Ataque de Oportunidade',
        nameEn: 'Attack of Opportunity',
        text: 'Se um adversário Corpo a corpo tentar sair desse alcance, faça uma rolagem de reação com um atributo à sua escolha contra a Dificuldade dele. Em sucesso escolha um efeito (dois em crítico):\n• Ele não pode sair de onde está.\n• Você causa dano igual ao da sua arma primária.\n• Você se move junto com ele.',
      },
      {
        name: 'Treinamento de Combate',
        nameEn: 'Combat Training',
        text: 'Você ignora o peso ao equipar armas. Ao causar dano físico, ganha bônus na rolagem de dano igual ao seu nível.',
      },
    ],
    subclasses: [
      {
        id: 'call-of-the-brave',
        name: 'Chamado do Bravo',
        nameEn: 'Call of the Brave',
        pitch: 'Para usar o poder dos inimigos como combustível.',
        foundation: [
          {
            name: 'Coragem',
            nameEn: 'Courage',
            text: 'Quando falhar numa rolagem com Medo, você ganha 1 Esperança.',
          },
          {
            name: 'Ritual de Batalha',
            nameEn: 'Battle Ritual',
            text: 'Uma vez por descanso longo, antes de tentar algo incrivelmente perigoso ou enfrentar um inimigo claramente superior, descreva o ritual ou preparação que faz. Então limpe 2 Estresse e ganhe 2 Esperança.',
          },
        ],
      },
      {
        id: 'call-of-the-slayer',
        name: 'Chamado do Matador',
        nameEn: 'Call of the Slayer',
        pitch: 'Para abater adversários com força imensa.',
        foundation: [
          {
            name: 'Matador',
            nameEn: 'Slayer',
            text: 'Você tem uma reserva de Dados de Matador. Numa rolagem com Esperança, pode colocar um d6 nesta carta em vez de ganhar Esperança (máximo igual à sua Proficiência). Ao fazer uma rolagem de ataque ou de dano, pode gastar quantos quiser, rolando-os e somando. No fim da sessão, limpe os não usados e ganhe 1 Esperança por dado limpo.',
          },
        ],
      },
    ],
    backgroundQuestions: [
      'Quem te ensinou a lutar, e por que essa pessoa ficou para trás quando você saiu de casa?',
      'Alguém te derrotou em batalha anos atrás e te deixou para morrer. Quem foi, e como te traiu?',
      'Que lugar lendário você sempre quis visitar, e por que ele é tão especial?',
    ],
    connectionQuestions: [
      'Nós nos conhecemos muito antes deste grupo se formar. Como?',
      'Em que tarefa do dia a dia, longe do campo de batalha, você costuma me ajudar?',
      'Que medo eu estou te ajudando a superar?',
    ],
  },
  {
    id: 'witch',
    name: 'Bruxa',
    nameEn: 'Witch',
    description:
      'Praticantes de magia que se comunicam com as forças da natureza e com entidades de outros reinos. Invocam poder por meio do ofício — magias, encantamentos, talismãs, ilusões e práticas pessoais — com a ajuda de ancestrais, divindades ou aspectos da natureza. Muitas vezes temidos e incompreendidos, os bruxos caminham sem medo na fronteira entre luz e sombra.',
    domains: ['sage', 'dread'],
    evasion: 10,
    hp: 6,
    items: ['Um bichinho de estimação pequeno e inofensivo', 'Uma pedra de vidência'],
    hopeFeature: {
      name: 'Encanto da Bruxa',
      nameEn: "Witch's Charm",
      text: 'Quando você ou um aliado a até Longe falhar numa rolagem de ação, você pode gastar 3 Esperança para transformá-la num sucesso com Medo.',
    },
    features: [
      {
        name: 'Maldição',
        nameEn: 'Hex',
        text: 'Marque 1 Estresse para Amaldiçoar temporariamente um alvo a até Longe. Amaldiçoado, ele sofre penalidade nas rolagens de dano e na Dificuldade igual ao seu patamar. Você pode amaldiçoar ao mesmo tempo um número de criaturas igual ao seu atributo de Conjuração.',
      },
      {
        name: 'Comungar',
        nameEn: 'Commune',
        text: 'Uma vez por descanso longo, num momento de calma, comungue com um ancestral, divindade, espírito ou ser de outro mundo. Faça uma pergunta e role d6 iguais ao seu atributo de Conjuração; escolha um resultado:\n• 1–3: você sente um sabor, cheiro ou sensação relacionado à resposta.\n• 4–5: você ouve sons ou tem uma visão relacionada à resposta.\n• 6: você vive psiquicamente uma cena relacionada à resposta, como se estivesse lá.',
      },
    ],
    subclasses: [
      {
        id: 'hedge',
        name: 'Sebe',
        nameEn: 'Hedge',
        pitch: 'Para usar seu ofício e fortalecer você e o grupo.',
        spellcastTrait: 'knowledge',
        foundation: [
          {
            name: 'Remédios de Ervas',
            nameEn: 'Herbal Remedies',
            text: 'Quando você ou um aliado na cena limpar 1 ou mais PV ou Estresse usando um consumível, aumente em 1 a quantidade limpa.',
          },
          {
            name: 'Talismã Encantado',
            nameEn: 'Enchanted Talisman',
            text: 'Uma vez por descanso, imbua um pequeno item com sua essência protetora: gaste quanta Esperança quiser e coloque o mesmo número de marcadores nesta carta. Quando quem segura o talismã receber dano, gaste um marcador para reduzir em 1 os PV marcados. Limpe os marcadores ao descansar.',
          },
        ],
      },
      {
        id: 'moon',
        name: 'Lua',
        nameEn: 'Moon',
        pitch: 'Para encarnar o poder celestial e amplificar sua magia.',
        spellcastTrait: 'instinct',
        foundation: [
          {
            name: 'Glamour da Noite',
            nameEn: "Night's Glamour",
            text: 'Faça uma rolagem de Conjuração (13) para se Encantar com uma fachada fascinante. Encantado, você tem vantagem em rolagens que aproveitem sua aparência ilusória, e adversários a até Perto precisam marcar 1 Estresse para te atacar. A menos que você marque 1 Estresse para mantê-lo, o encanto cai quando você marca 1 PV ou causa dano.',
          },
        ],
      },
    ],
    backgroundQuestions: [
      'Quem da sua comunidade temia sua magia? Que boato espalhou sobre você, e que verdade ele continha?',
      'Uma vez você usou seu poder para ajudar alguém em apuros. Quem era, e por que veio até você?',
      'Sua magia já abriu uma porta que deveria ter ficado fechada. Quem ou o que estava do outro lado?',
    ],
    connectionQuestions: [
      'Que ritual ou prática única eu te ensinei que agora fazemos juntos?',
      'Uma vez apareci num sonho seu e compartilhei uma visão do futuro. O que eu te disse?',
      'Sobre o que você costuma me pedir conselho?',
    ],
  },
  {
    id: 'wizard',
    name: 'Mago',
    nameEn: 'Wizard',
    description:
      'Seja numa instituição ou estudando sozinhos, os magos adquirem poder mágico imenso ao longo de anos de aprendizado, usando livros, pedras, poções e ervas. Alguns se dedicam a uma escola de magia; outros aprendem de várias disciplinas. Muitos viram figuras sábias e poderosas — mas é entre os próprios magos que surgem os maiores conflitos sobre guardar e compartilhar segredos.',
    domains: ['codex', 'splendor'],
    evasion: 11,
    hp: 5,
    items: [
      'Um livro que você está tentando traduzir',
      'Um pequeno elemental de estimação inofensivo',
    ],
    hopeFeature: {
      name: 'Agora Não',
      nameEn: 'Not This Time',
      text: 'Gaste 3 Esperança para forçar um adversário a até Longe a rolar de novo um ataque ou rolagem de dano.',
    },
    features: [
      {
        name: 'Prestidigitação',
        nameEn: 'Prestidigitation',
        text: 'Você pode criar à vontade efeitos mágicos sutis e inofensivos: mudar a cor de um objeto, criar um cheiro, acender uma vela, fazer um objeto pequeno flutuar, iluminar um cômodo ou consertar algo pequeno.',
      },
      {
        name: 'Padrões Estranhos',
        nameEn: 'Strange Patterns',
        text: 'Escolha um número entre 1 e 12. Quando tirar esse número num Dado de Dualidade, ganhe 1 Esperança ou limpe 1 Estresse. Você pode trocar o número num descanso longo.',
      },
    ],
    subclasses: [
      {
        id: 'school-of-knowledge',
        name: 'Escola do Conhecimento',
        nameEn: 'School of Knowledge',
        pitch: 'Para ter uma compreensão aguçada do mundo ao seu redor.',
        spellcastTrait: 'knowledge',
        foundation: [
          {
            name: 'Preparado',
            nameEn: 'Prepared',
            text: 'Pegue uma carta de domínio adicional do seu nível ou abaixo, de um domínio a que você tem acesso.',
          },
          {
            name: 'Perito',
            nameEn: 'Adept',
            text: 'Ao usar uma Experiência, você pode marcar 1 Estresse em vez de gastar 1 Esperança. Se fizer isso, dobre o modificador da Experiência nessa rolagem.',
          },
        ],
        extraDomainCards: 1,
      },
      {
        id: 'school-of-war',
        name: 'Escola da Guerra',
        nameEn: 'School of War',
        pitch: 'Para usar magia treinada na violência.',
        spellcastTrait: 'knowledge',
        foundation: [
          {
            name: 'Mago de Batalha',
            nameEn: 'Battlemage',
            text: 'Você focou seus estudos em virar uma força invencível no campo de batalha. Ganhe um espaço de PV adicional.',
          },
          {
            name: 'Encare Seu Medo',
            nameEn: 'Face Your Fear',
            text: 'Ao ter sucesso com Medo numa rolagem de ataque, cause 1d10 de dano mágico extra.',
          },
        ],
        mods: { hp: 1 },
      },
    ],
    backgroundQuestions: [
      'Por quais responsabilidades sua comunidade contava com você? Como você a decepcionou?',
      'Você passou a vida procurando um livro ou objeto de grande importância. O que é, e por que é tão importante?',
      'Você tem um rival poderoso. Quem é, e por que está tão determinado a derrotá-lo?',
    ],
    connectionQuestions: [
      'Que favor eu te pedi que você não sabe se consegue cumprir?',
      'Que hobby esquisito ou fascínio estranho nós dois compartilhamos?',
      'Que segredo sobre você confiou só a mim?',
    ],
    choices: [{ kind: 'strangePatterns' }],
  },
];

export function findClass(id: string): ClassData | undefined {
  return CLASSES.find((c) => c.id === id);
}

/** Martial Artist "Stance Fighter": Tier 1 stances available at creation. */
export const TIER1_STANCES = [
  {
    id: 'favored',
    name: 'Favorita',
    nameEn: 'Favored',
    text: 'Ganhe bônus nas rolagens de dano igual a um atributo à sua escolha.',
  },
  {
    id: 'invigorating',
    name: 'Revigorante',
    nameEn: 'Invigorating',
    text: 'Num ataque bem-sucedido, role 1d4. Com resultado 4, ganhe 1 Foco.',
  },
  {
    id: 'quick',
    name: 'Rápida',
    nameEn: 'Quick',
    text: 'Ao atacar, você pode gastar 1 Foco ou marcar 1 Estresse para atingir outra criatura no alcance com o mesmo ataque.',
  },
  {
    id: 'reliable',
    name: 'Confiável',
    nameEn: 'Reliable',
    text: 'Ganhe +1 nas rolagens de ataque.',
  },
] as const;

/** Sorcerer "Elementalist" options. */
export const ELEMENTS = ['Ar', 'Terra', 'Fogo', 'Relâmpago', 'Água'] as const;

/** Warlock sphere-of-influence examples. */
export const PATRON_SPHERES = [
  'Ambição',
  'Artistas',
  'Caos',
  'Escuridão',
  'Morte',
  'Apostadores',
  'Honra',
  'Justiça',
  'Líderes',
  'Amor',
  'Misericórdia',
  'Travessura',
  'Natureza',
  'Protetores',
  'Vingança',
  'Estudiosos',
  'Segredos',
  'Soldados',
  'Força',
  'Viajantes',
  'Trapaceiros',
  'Verdade',
  'Guerra',
  'Sabedoria',
] as const;

/** Beastbound "Companion" example experiences. */
export const COMPANION_EXPERIENCES = [
  'Distração Ousada',
  'Escalador Habilidoso',
  'Buscar',
  'Amigável',
  'Guardião da Floresta',
  'Horripilante',
  'Intimidador',
  'Leal Até o Fim',
  'Navegação',
  'Ágil',
  'Ninguém Fica para Trás',
  'Em Alerta',
  'Protetor',
  'Companheiro Real',
  'Batedor',
  'Animal de Serviço',
  'Montaria de Confiança',
  'Vigilante',
  'Sempre Achamos',
  'Não Dá pra Acertar o que Não Dá pra Achar',
] as const;
