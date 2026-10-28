import { AncestryData } from './types';

// Source: Daggerheart SRD 2.0, "Ancestries" (pp. 32–38). Summaries condensed, features translated.

export const ANCESTRIES: readonly AncestryData[] = [
  {
    id: 'aetheris',
    name: 'Aetheris',
    nameEn: 'Aetheris',
    summary:
      'Humanoides alados com marcas sagradas, descendentes de anjos dos Salões Acima. Têm de 1,5 a 2,1 m, cores vibrantes e uma “aura consagrada” que faz olhos, corpo ou auréola brilharem. Vivem cerca de 350 anos.',
    features: [
      {
        name: 'Aura Consagrada',
        nameEn: 'Hallowed Aura',
        text: 'Uma vez por descanso longo, quando um aliado a até Perto rolar com Medo, você pode transformar a rolagem em uma rolagem com Esperança.',
      },
      {
        name: 'Asas Celestiais',
        nameEn: 'Celestial Wings',
        text: 'Você tem asas e pode voar. Uma vez por cena, enquanto voa, você pode gastar 1 Esperança em vez de marcar um Espaço de Armadura.',
      },
    ],
  },
  {
    id: 'clank',
    name: 'Clank',
    nameEn: 'Clank',
    summary:
      'Seres mecânicos conscientes feitos de metal, madeira ou pedra. Podem lembrar humanoides, animais ou até objetos, e muitos têm configurações sob medida (garras, rodas, armas embutidas). O corpo é praticamente imortal enquanto houver peças; a mente, não.',
    features: [
      {
        name: 'Propósito de Fábrica',
        nameEn: 'Purposeful Design',
        text: 'Decida quem te fez e para quê. Na criação, escolha uma das suas Experiências que combine com esse propósito e ganhe +1 permanente nela.',
      },
      {
        name: 'Eficiente',
        nameEn: 'Efficient',
        text: 'Ao fazer um descanso curto, você pode escolher uma ação de descanso longo em vez de uma de descanso curto.',
      },
    ],
  },
  {
    id: 'drakona',
    name: 'Drakona',
    nameEn: 'Drakona',
    summary:
      'Parecem dragões sem asas em forma humanoide, com escamas grossas e um sopro elemental herdado da família. Têm de 1,5 a 2,1 m, dentes que nunca param de crescer e vivem cerca de 350 anos.',
    features: [
      {
        name: 'Escamas',
        nameEn: 'Scales',
        text: 'Suas escamas são uma proteção natural. Quando você receberia dano Grave, pode marcar 1 Estresse para marcar 1 PV a menos.',
      },
      {
        name: 'Sopro Elemental',
        nameEn: 'Elemental Breath',
        text: 'Escolha um elemento para seu sopro (como eletricidade, fogo ou gelo). Você pode usá-lo contra um alvo ou grupo a até Muito Perto, como uma arma de Instinto que causa d8 de dano mágico com sua Proficiência.',
      },
    ],
  },
  {
    id: 'dwarf',
    name: 'Anão',
    nameEn: 'Dwarf',
    summary:
      'Humanoides baixos (1,2 a 1,7 m), de corpo quadrado, musculatura densa e cabelo grosso. Pele e unhas ricas em queratina permitem incrustar gemas no corpo. Pessoas de todos os gêneros podem ter barba. Vivem até 250 anos.',
    features: [
      {
        name: 'Pele Grossa',
        nameEn: 'Thick Skin',
        text: 'Ao receber dano Menor, você pode marcar 2 Estresse em vez de 1 PV.',
      },
      {
        name: 'Fortitude Aumentada',
        nameEn: 'Increased Fortitude',
        text: 'Gaste 3 Esperança para reduzir à metade o dano físico recebido.',
      },
    ],
  },
  {
    id: 'earthkin',
    name: 'Filho da Terra',
    nameEn: 'Earthkin',
    summary:
      'Elementais-kin descendentes de elementais da terra: corpo de carne e rocha, cristal, argila, solo ou areia. Nascem como pequenos torrões de terra, têm de 1,5 a 2 m e vivem cerca de 300 anos; ferimentos parecem rachaduras na pedra.',
    features: [
      {
        name: 'Pele de Pedra',
        nameEn: 'Stoneskin',
        text: 'Ganhe +1 permanente no seu Valor de Armadura e nos seus limiares de dano na criação do personagem.',
      },
      {
        name: 'Inamovível',
        nameEn: 'Immovable',
        text: 'Enquanto estiver tocando o chão, você não pode ser erguido nem movido contra a sua vontade.',
      },
    ],
    mods: [{ armorScore: 1, thresholds: 1 }, undefined],
  },
  {
    id: 'elf',
    name: 'Elfo',
    nameEn: 'Elf',
    summary:
      'Humanoides altos (1,8 a 2 m) de orelhas pontudas e sentidos aguçados. Em vez de dormir, entram num transe celestial. Alguns têm uma “forma mística” ligada à natureza (sardas celestes, folhas no cabelo, olhos de fogo). Vivem cerca de 350 anos.',
    features: [
      {
        name: 'Reflexos Rápidos',
        nameEn: 'Quick Reactions',
        text: 'Marque 1 Estresse para ganhar vantagem numa rolagem de reação.',
      },
      {
        name: 'Transe Celestial',
        nameEn: 'Celestial Trance',
        text: 'Durante um descanso, você pode entrar em transe para escolher uma ação de descanso adicional.',
      },
    ],
  },
  {
    id: 'emberkin',
    name: 'Filho da Brasa',
    nameEn: 'Emberkin',
    summary:
      'Elementais-kin descendentes de elementais do fogo: cabelo em chamas, olhos de brasa, brilho sob a pele que se acende com as emoções. Nascem como bolinhas de fogo, têm de 1,5 a 2,1 m, vivem cerca de 250 anos e viram cinzas ao morrer.',
    features: [
      {
        name: 'À Prova de Fogo',
        nameEn: 'Fireproof',
        text: 'Você é imune a dano de fogo, mágico ou comum.',
      },
      {
        name: 'Ignição',
        nameEn: 'Ignition',
        text: 'Marque 1 Estresse para envolver sua arma primária em chamas até o fim da cena. Enquanto ela queima, emite luz forte e você ganha +1d6 nas rolagens de dano com ela.',
      },
    ],
  },
  {
    id: 'faerie',
    name: 'Fada',
    nameEn: 'Faerie',
    summary:
      'Humanoides alados com traços de inseto — braços extras, olhos compostos, órgãos luminosos, exoesqueleto ou ferrão — muitas vezes camuflados como plantas. Medem de 60 cm a 1,5 m (alguns até 2,1 m), passam por uma metamorfose e vivem cerca de 50 anos.',
    features: [
      {
        name: 'Dobra-Sorte',
        nameEn: 'Luckbender',
        text: 'Uma vez por sessão, depois que você ou um aliado voluntário a até Perto fizer uma rolagem de ação, você pode gastar 3 Esperança para rolar de novo os Dados de Dualidade.',
      },
      {
        name: 'Asas',
        nameEn: 'Wings',
        text: 'Você pode voar. Enquanto voa, pode marcar 1 Estresse depois que um adversário te atacar para ganhar +2 de Evasão contra esse ataque.',
      },
    ],
  },
  {
    id: 'faun',
    name: 'Fauno',
    nameEn: 'Faun',
    summary:
      'Parecem bodes humanoides, com chifres curvos, pupilas quadradas e cascos fendidos. Têm de 1,2 a 2 m (a altura muda muito com a postura), membros longos e chutes poderosos. Vivem cerca de 225 anos.',
    features: [
      {
        name: 'Salto Caprino',
        nameEn: 'Caprine Leap',
        text: 'Você pode saltar para qualquer ponto a até Perto como se fosse um movimento normal, pulando obstáculos, vãos e barreiras com facilidade.',
      },
      {
        name: 'Coice',
        nameEn: 'Kick',
        text: 'Ao acertar um ataque contra um alvo Corpo a corpo, você pode marcar 1 Estresse para chutá-lo e tomar impulso, causando 2d6 de dano extra e empurrando você ou o alvo para Muito Perto.',
      },
    ],
  },
  {
    id: 'firbolg',
    name: 'Firbolg',
    nameEn: 'Firbolg',
    summary:
      'Humanoides bovinos de nariz largo e orelhas caídas; alguns, chamados minotauros, têm cabeça de gado. Altos e musculosos (1,5 a 2,1 m), cobertos de pelo e muitas vezes com chifres. Vivem cerca de 150 anos.',
    features: [
      {
        name: 'Investida',
        nameEn: 'Charge',
        text: 'Ao ter sucesso numa rolagem de Agilidade para ir de Longe ou Muito Longe até Corpo a corpo de um ou mais alvos, você pode marcar 1 Estresse para causar 1d12 de dano físico a todos os alvos Corpo a corpo.',
      },
      {
        name: 'Imperturbável',
        nameEn: 'Unshakable',
        text: 'Quando você marcaria 1 Estresse, role 1d6. Com 6, não marque.',
      },
    ],
  },
  {
    id: 'fungril',
    name: 'Fungril',
    nameEn: 'Fungril',
    summary:
      'Parecem cogumelos humanoides, de tons terrosos a vermelhos, amarelos, roxos e azuis, com corpos muito variados (de 60 cm a 2,1 m). Comunicam-se sem palavras por uma rede micelial. Vivem cerca de 300 anos, às vezes mais.',
    features: [
      {
        name: 'Rede Fungril',
        nameEn: 'Fungril Network',
        text: 'Faça uma rolagem de Instinto (12) para usar sua rede micelial e falar com outros da sua ancestralidade. Em sucesso, vocês se comunicam a qualquer distância.',
      },
      {
        name: 'Conexão com a Morte',
        nameEn: 'Death Connection',
        text: 'Tocando um cadáver recente, você pode marcar 1 Estresse para extrair dele uma memória ligada a uma emoção ou sensação à sua escolha.',
      },
    ],
  },
  {
    id: 'galapa',
    name: 'Galapa',
    nameEn: 'Galapa',
    summary:
      'Tartarugas antropomórficas com grandes cascos abaulados onde podem se recolher. Têm de 1,2 a 1,8 m, tons verdes e marrons com padrões únicos no casco, movem-se devagar e vivem cerca de 150 anos.',
    features: [
      {
        name: 'Casco',
        nameEn: 'Shell',
        text: 'Ganhe bônus nos seus limiares de dano igual à sua Proficiência.',
      },
      {
        name: 'Recolher',
        nameEn: 'Retract',
        text: 'Marque 1 Estresse para se recolher no casco. Lá dentro, você tem resistência a dano físico, desvantagem em rolagens de ação e não pode se mover.',
      },
    ],
    mods: [{ thresholdsPlusProficiency: true }, undefined],
  },
  {
    id: 'giant',
    name: 'Gigante',
    nameEn: 'Giant',
    summary:
      'Humanoides enormes (2 a 2,6 m), de ombros largos, braços longos e de um a três olhos — os de um olho só são chamados ciclopes. Nascem sem olhos e só os formam por completo por volta dos 10 anos. Vivem cerca de 75 anos.',
    features: [
      {
        name: 'Resistência',
        nameEn: 'Endurance',
        text: 'Ganhe um espaço de PV adicional na criação do personagem.',
      },
      {
        name: 'Alcance',
        nameEn: 'Reach',
        text: 'Trate qualquer arma, habilidade, magia ou característica com alcance Corpo a corpo como se tivesse alcance Muito Perto.',
      },
    ],
    mods: [{ hp: 1 }, undefined],
  },
  {
    id: 'gnome',
    name: 'Gnomo',
    nameEn: 'Gnome',
    summary:
      'Humanoides pequenos (cerca de 90 cm) de cabeça cônica, braços longos, mãos grandes e olhos arregalados, que herdam da família a capacidade de se teleportar curtas distâncias (em fumaça, luzinhas ou evaporando). Vivem cerca de 200 anos.',
    features: [
      {
        name: 'Dedos Ágeis',
        nameEn: 'Nimble Fingers',
        text: 'Ao fazer uma rolagem de Acurácia, você pode gastar 2 Esperança para rolar de novo o seu Dado de Esperança.',
      },
      {
        name: 'Passo Cintilante',
        nameEn: 'Flicker Step',
        text: 'Uma vez por cena, você pode se teleportar para outro ponto que consiga ver a até Longe.',
      },
    ],
  },
  {
    id: 'goblin',
    name: 'Goblin',
    nameEn: 'Goblin',
    summary:
      'Humanoides pequenos (90 cm a 1,2 m) de olhos grandes e orelhas enormes e membranosas, com audição e visão afiadas mesmo no escuro. Usam a posição das orelhas para se comunicar. Vivem cerca de 100 anos.',
    features: [
      {
        name: 'Pé Firme',
        nameEn: 'Surefooted',
        text: 'Você ignora desvantagem em rolagens de Agilidade.',
      },
      {
        name: 'Sentido de Perigo',
        nameEn: 'Danger Sense',
        text: 'Uma vez por descanso, marque 1 Estresse para forçar um adversário a rolar de novo um ataque contra você ou um aliado a até Muito Perto.',
      },
    ],
  },
  {
    id: 'halfling',
    name: 'Halfling',
    nameEn: 'Halfling',
    summary:
      'Humanoides pequenos (90 cm a 1,2 m) de pés grandes e peludos e orelhas arredondadas. Sintonizados com os campos magnéticos do mundo, têm uma bússola interna, olfato e audição aguçados e aparência jovem a vida toda. Vivem cerca de 150 anos.',
    features: [
      {
        name: 'Traz-Sorte',
        nameEn: 'Luckbringer',
        text: 'No início de cada sessão, todos do seu grupo ganham 1 Esperança.',
      },
      {
        name: 'Bússola Interna',
        nameEn: 'Internal Compass',
        text: 'Quando tirar 1 no seu Dado de Esperança, você pode rolá-lo de novo.',
      },
    ],
  },
  {
    id: 'human',
    name: 'Humano',
    nameEn: 'Human',
    summary:
      'Reconhecidos pelas mãos hábeis, orelhas arredondadas e corpos feitos para a resistência. Têm de 1,5 a 2 m, físicos muito variados e se adaptam bem a climas difíceis. Vivem cerca de 100 anos.',
    features: [
      {
        name: 'Fôlego',
        nameEn: 'High Stamina',
        text: 'Ganhe um espaço de Estresse adicional na criação do personagem.',
      },
      {
        name: 'Adaptabilidade',
        nameEn: 'Adaptability',
        text: 'Ao falhar numa rolagem que usou uma das suas Experiências, você pode marcar 1 Estresse para rolar de novo.',
      },
    ],
    mods: [{ stress: 1 }, undefined],
  },
  {
    id: 'infernis',
    name: 'Infernis',
    nameEn: 'Infernis',
    summary:
      'Humanoides de caninos afiados, orelhas pontudas e chifres, descendentes de demônios dos Círculos Abaixo. Alguns têm cauda. Possuem um “semblante terrível” que muda dentes, olhos e chifres com emoções fortes. Vivem até 350 anos.',
    features: [
      {
        name: 'Destemido',
        nameEn: 'Fearless',
        text: 'Ao rolar com Medo, você pode marcar 2 Estresse para transformar a rolagem em uma rolagem com Esperança.',
      },
      {
        name: 'Semblante Terrível',
        nameEn: 'Dread Visage',
        text: 'Você tem vantagem em rolagens para intimidar criaturas hostis.',
      },
    ],
  },
  {
    id: 'katari',
    name: 'Katari',
    nameEn: 'Katari',
    summary:
      'Humanoides felinos com garras retráteis, pupilas em fenda, orelhas triangulares que giram quase 180° e bigodes. Cerca de metade tem cauda. Têm de 90 cm a 2 m e vivem cerca de 150 anos.',
    features: [
      {
        name: 'Instinto Felino',
        nameEn: 'Feline Instincts',
        text: 'Ao fazer uma rolagem de Agilidade, você pode gastar 2 Esperança para rolar de novo o seu Dado de Esperança.',
      },
      {
        name: 'Garras Retráteis',
        nameEn: 'Retracting Claws',
        text: 'Faça uma rolagem de Agilidade para arranhar um alvo Corpo a corpo. Em sucesso, ele fica temporariamente Vulnerável.',
      },
    ],
  },
  {
    id: 'orc',
    name: 'Orc',
    nameEn: 'Orc',
    summary:
      'Humanoides de traços quadrados e presas de javali que saem da mandíbula inferior, muitas vezes decoradas. Pele e cabelo em tons verdes, azuis, rosados ou cinzas, físico musculoso, de 1,5 a 2 m. Vivem cerca de 125 anos.',
    features: [
      {
        name: 'Resistente',
        nameEn: 'Sturdy',
        text: 'Quando você tem só 1 PV restante, ataques contra você têm desvantagem.',
      },
      {
        name: 'Presas',
        nameEn: 'Tusks',
        text: 'Ao acertar um ataque contra um alvo Corpo a corpo, você pode gastar 1 Esperança para chifrá-lo com as presas, causando 1d6 de dano extra.',
      },
    ],
  },
  {
    id: 'ribbet',
    name: 'Ribbet',
    nameEn: 'Ribbet',
    summary:
      'Sapos antropomórficos de olhos saltados e mãos e pés palmados, que se movem pulando e nadam com facilidade. Têm de 90 cm a 1,4 m, nascem de ovos na água como girinos e vivem cerca de 100 anos.',
    features: [
      {
        name: 'Anfíbio',
        nameEn: 'Amphibious',
        text: 'Você respira e se move naturalmente debaixo d’água.',
      },
      {
        name: 'Língua Comprida',
        nameEn: 'Long Tongue',
        text: 'Você pode usar sua língua para agarrar coisas a até Perto. Marque 1 Estresse para usá-la como uma arma de Acurácia de alcance Perto que causa d12 de dano físico com sua Proficiência.',
      },
    ],
  },
  {
    id: 'simiah',
    name: 'Simiah',
    nameEn: 'Simiah',
    summary:
      'Macacos antropomórficos de membros longos e pés preênseis, de 60 cm a 1,8 m. Usam os pés para se comunicar, trabalhar e lutar; alguns têm cauda preênsil. Ótimos escaladores, vivem cerca de 100 anos.',
    features: [
      {
        name: 'Escalador Nato',
        nameEn: 'Natural Climber',
        text: 'Você tem vantagem em rolagens de Agilidade que envolvam equilíbrio e escalada.',
      },
      {
        name: 'Ágil',
        nameEn: 'Nimble',
        text: 'Ganhe +1 permanente na sua Evasão na criação do personagem.',
      },
    ],
    mods: [undefined, { evasion: 1 }],
  },
  {
    id: 'skykin',
    name: 'Filho do Céu',
    nameEn: 'Skykin',
    summary:
      'Elementais-kin descendentes de elementais do ar: pele que muda de cor como o céu, cabelo de fumaça ou nuvem e brisas constantes ao redor. Nascem como sopros de ar guardados em potes, têm de 1,7 a 2,1 m e somem no ar ao morrer, por volta dos 300 anos.',
    features: [
      {
        name: 'Força do Vendaval',
        nameEn: 'Gale Force',
        text: 'Marque 1 Estresse para invocar uma rajada que leva você ou um aliado a até Muito Perto para qualquer ponto a até Muito Longe. Além disso, você sempre controla a velocidade da sua queda.',
      },
      {
        name: 'Olho da Tempestade',
        nameEn: 'Eye of the Storm',
        text: 'Gaste 2 Esperança para dar a você ou a um aliado Corpo a corpo +1 de Evasão até receber dano Grave ou você usar esta característica de novo.',
      },
    ],
  },
  {
    id: 'tidekin',
    name: 'Filho da Maré',
    nameEn: 'Tidekin',
    summary:
      'Elementais-kin descendentes de elementais da água: orelhas como barbatanas, dedos palmados e cores de rio ou de oceano profundo, às vezes ondulando sob a pele. Nascem como pocinhas d’água, têm de 1,5 a 2 m, vivem cerca de 300 anos e se dissolvem em água ao morrer.',
    features: [
      {
        name: 'Anfíbio',
        nameEn: 'Amphibious',
        text: 'Você respira e se move naturalmente debaixo d’água.',
      },
      {
        name: 'Fonte da Vida',
        nameEn: 'Lifespring',
        text: 'Uma vez por descanso, tendo acesso a um pouco de água, você pode marcar 1 Estresse para limpar 1 PV seu ou de um aliado a até Muito Perto.',
      },
    ],
  },
];

export function findAncestry(id: string): AncestryData | undefined {
  return ANCESTRIES.find((a) => a.id === id);
}
