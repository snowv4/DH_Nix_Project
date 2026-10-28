import { CommunityData } from './types';

// Source: Daggerheart SRD 2.0, "Communities" (pp. 38–42). Summaries condensed, features translated.

export const COMMUNITIES: readonly CommunityData[] = [
  {
    id: 'duneborne',
    name: 'Das Dunas',
    nameEn: 'Duneborne',
    summary:
      'Você fez seu lar entre as areias movediças e o clima árido do deserto. Alguns viajam pelas dunas com seus rebanhos; outros vivem ao redor de oásis, compartilhando recursos raros. Dão grande valor aos laços de família e à contribuição de todos.',
    adjectives: ['adaptável', 'centrado', 'colaborativo', 'devotado', 'alegre', 'observador'],
    feature: {
      name: 'Oásis',
      nameEn: 'Oasis',
      text: 'Durante um descanso curto, você ou um aliado pode rolar de novo um dado usado numa ação de descanso e ficar com o maior resultado.',
    },
  },
  {
    id: 'freeborne',
    name: 'Libertos',
    nameEn: 'Freeborne',
    summary:
      'Você vem de um coletivo que já viveu sob um governo tirano e hoje é livre. As cicatrizes da opressão unem famílias e vizinhos por gerações, e eles celebram com fervor seus feriados, arte, comida e costumes.',
    adjectives: ['otimista', 'cauteloso', 'corajoso', 'alegre', 'subversivo', 'traumatizado'],
    feature: {
      name: 'Sem Correntes',
      nameEn: 'Unbound',
      text: 'Uma vez por sessão, ao rolar com Medo, você pode transformar a rolagem em uma rolagem com Esperança.',
    },
  },
  {
    id: 'frostborne',
    name: 'Do Gelo',
    nameEn: 'Frostborne',
    summary:
      'Você vem de um lugar de neve e gelo, forjado num frio implacável. Sem madeira, usam gelo, pedra, osso e peles; fazem os suprimentos durarem, acompanham o clima e o sol, e alguns criaram formas de comunicação sem palavras.',
    adjectives: ['astuto', 'sociável', 'intrépido', 'determinado', 'quieto', 'caloroso'],
    feature: {
      name: 'Resiliente',
      nameEn: 'Hardy',
      text: 'Ao fazer um descanso, você limpa 1 PV.',
    },
  },
  {
    id: 'hearthborne',
    name: 'Da Lareira',
    nameEn: 'Hearthborne',
    summary:
      'Você tem origem humilde, numa vila modesta ou no campo, em comunidades pequenas e pacíficas, agrícolas e pastoris, com artesãos locais. Às vezes respondem a governantes distantes que controlam a terra; em geral, são acolhedores e hospitaleiros.',
    adjectives: ['cuidadoso', 'generoso', 'fechado', 'falante', 'sorridente', 'tradicional'],
    feature: {
      name: 'Unidos',
      nameEn: 'Close-Knit',
      text: 'Uma vez por descanso longo, você pode gastar quanta Esperança quiser para dar a mesma quantidade de Esperança a um aliado a até Longe.',
    },
  },
  {
    id: 'highborne',
    name: 'Da Nobreza',
    nameEn: 'Highborne',
    summary:
      'Você está acostumado a uma vida de elegância, opulência e prestígio nas camadas mais altas da sociedade, com riqueza material, poder e influência. Títulos e posses importam muito, e a mobilidade social é pequena.',
    adjectives: ['amável', 'franco', 'ardiloso', 'empreendedor', 'ostentoso', 'imperturbável'],
    feature: {
      name: 'Privilégio',
      nameEn: 'Privilege',
      text: 'Você tem vantagem em rolagens para lidar com nobres, negociar preços ou usar sua reputação para conseguir o que quer.',
    },
  },
  {
    id: 'loreborne',
    name: 'Do Saber',
    nameEn: 'Loreborne',
    summary:
      'Você vem de uma sociedade que valoriza muito o conhecimento acadêmico ou político: preservação histórica, ciência, política, mitologia. A maioria estuda em instituições nas grandes cidades; alguns coletam saber no mundo natural.',
    adjectives: ['direto', 'eloquente', 'curioso', 'paciente', 'entusiasmado', 'espirituoso'],
    feature: {
      name: 'Bem Informado',
      nameEn: 'Well-Read',
      text: 'Você tem vantagem em rolagens que envolvam a história, a cultura ou a política de uma pessoa ou lugar importante.',
    },
  },
  {
    id: 'orderborne',
    name: 'Da Ordem',
    nameEn: 'Orderborne',
    summary:
      'Você vem de um coletivo focado em disciplina ou fé, unido em torno de um valor ou objetivo comum — um deus, uma doutrina, um ofício. Costumam estar entre os mais poderosos da região; os mais temidos são os de estrutura militar.',
    adjectives: ['ambicioso', 'benevolente', 'pensativo', 'prudente', 'sarcástico', 'estoico'],
    feature: {
      name: 'Dedicado',
      nameEn: 'Dedicated',
      text: 'Anote três ditados ou valores que sua criação te ensinou. Uma vez por descanso, ao descrever como está seguindo um desses princípios na sua ação, você pode rolar um d20 como Dado de Esperança.',
    },
  },
  {
    id: 'reborne',
    name: 'Renascidos',
    nameEn: 'Reborne',
    summary:
      'Você já fez parte de outra comunidade e não faz mais — por escolha, expulsão, perda de memória ou até por ter voltado do além. Os renascidos se unem apenas pela solidão e carregam essa ferida, mas podem se redefinir e criar novos laços.',
    adjectives: ['curioso', 'esperançoso', 'inocente', 'isolado', 'enlutado', 'estranho'],
    feature: {
      name: 'Família Escolhida',
      nameEn: 'Found Family',
      text: 'Uma vez por descanso, você pode gastar 1 Esperança para usar uma Experiência de um aliado como se fosse sua, descrevendo como o tempo com essa pessoa te preparou para este momento. Ao entrar numa nova comunidade ou reencontrar a antiga, você pode trocar permanentemente esta carta pela dela.',
    },
  },
  {
    id: 'ridgeborne',
    name: 'Das Montanhas',
    nameEn: 'Ridgeborne',
    summary:
      'Seu lar são os picos rochosos e penhascos das montanhas. Desenvolveram tecnologias para mover gente e carga em terreno difícil, crescem escalando e são fortes e teimosos. Cidades talhadas em penhascos e castelos de pedra são comuns.',
    adjectives: ['ousado', 'resistente', 'indomável', 'leal', 'reservado', 'teimoso'],
    feature: {
      name: 'Firme',
      nameEn: 'Steady',
      text: 'Você tem vantagem em rolagens para atravessar penhascos e beiradas perigosas, navegar em ambientes hostis e usar seu conhecimento de sobrevivência.',
    },
  },
  {
    id: 'seaborne',
    name: 'Do Mar',
    nameEn: 'Seaborne',
    summary:
      'Você viveu num grande corpo d’água ou perto dele — em portos ou a bordo de navios, onde “lar” é o barco e a tripulação. Aprendem a pescar e nadar desde cedo e são muito procurados como marinheiros e capitães.',
    adjectives: ['franco', 'cooperativo', 'exuberante', 'feroz', 'resoluto', 'calejado'],
    feature: {
      name: 'Conhecer a Maré',
      nameEn: 'Know the Tide',
      text: 'Você sente o fluxo e o refluxo da vida. Ao rolar com Medo, coloque um marcador na sua carta de comunidade (até um número igual ao seu nível). Antes de uma rolagem de ação, gaste quantos marcadores quiser para ganhar +1 por marcador. No fim da sessão, limpe os não usados.',
    },
  },
  {
    id: 'slyborne',
    name: 'Da Malandragem',
    nameEn: 'Slyborne',
    summary:
      'Você vem de um grupo que vive à margem da lei: criminosos, trapaceiros e golpistas, com habilidades como falsificação, roubo e contrabando. Podem parecer desleais, mas seguem códigos de honra rígidos — e quebrá-los pode ter um fim terrível.',
    adjectives: ['calculista', 'esperto', 'formidável', 'perceptivo', 'astuto', 'tenaz'],
    feature: {
      name: 'Malandro',
      nameEn: 'Scoundrel',
      text: 'Você tem vantagem em rolagens para negociar com criminosos, detectar mentiras ou encontrar um lugar seguro para se esconder.',
    },
  },
  {
    id: 'underborne',
    name: 'Do Subterrâneo',
    nameEn: 'Underborne',
    summary:
      'Você vem de uma sociedade subterrânea, de tocas familiares a metrópoles em cavernas, famosa pela engenharia e pela coragem diante de feras das profundezas. Muitos desenvolveram linguagens não verbais.',
    adjectives: ['sereno', 'esquivo', 'indomável', 'inovador', 'engenhoso', 'despretensioso'],
    feature: {
      name: 'Vida na Penumbra',
      nameEn: 'Low-Light Living',
      text: 'Em áreas de pouca luz ou sombra densa, você tem vantagem em rolagens para se esconder, investigar ou perceber detalhes nessa área.',
    },
  },
  {
    id: 'wanderborne',
    name: 'Andarilhos',
    nameEn: 'Wanderborne',
    summary:
      'Você viveu como nômade, sem lar fixo, conhecendo muitas culturas. Valorizam mais informação, habilidades e contatos do que posses, e os perigos da estrada os tornam conhecidos pela lealdade inabalável.',
    adjectives: [
      'enigmático',
      'magnânimo',
      'divertido',
      'confiável',
      'esperto',
      'pouco convencional',
    ],
    feature: {
      name: 'Mochila Nômade',
      nameEn: 'Nomadic Pack',
      text: 'Adicione uma Mochila Nômade ao inventário. Uma vez por sessão, você pode gastar 1 Esperança para tirar dela um item comum útil para a situação (combine com o mestre qual).',
    },
  },
  {
    id: 'warborne',
    name: 'Da Guerra',
    nameEn: 'Warborne',
    summary:
      'Você vem de um lugar que é, ou foi, devastado pela guerra — civis numa zona de conflito, soldados que serviram juntos ou cidadãos de nações em guerra há décadas. São engenhosos, sabem se defender e carregam traumas para a vida toda.',
    adjectives: ['estratégico', 'devastado', 'determinado', 'calculista', 'inabalável', 'devotado'],
    feature: {
      name: 'Cara de Coragem',
      nameEn: 'Brave Face',
      text: 'Uma vez por sessão, quando seria forçado a marcar 1 Estresse, você pode gastar 1 Esperança no lugar.',
    },
  },
  {
    id: 'wildborne',
    name: 'Da Floresta',
    nameEn: 'Wildborne',
    summary:
      'Você viveu no coração da floresta, numa comunidade dedicada a conservar sua terra e ligada à fauna local. Integram vilas e cidades ao ambiente — nas copas ou sob elas — e costumam ficar reclusos e escondidos.',
    adjectives: ['resistente', 'leal', 'acolhedor', 'recluso', 'sagaz', 'vibrante'],
    feature: {
      name: 'Pés Leves',
      nameEn: 'Lightfoot',
      text: 'Seu movimento é naturalmente silencioso. Você tem vantagem em rolagens para se mover sem ser ouvido.',
    },
  },
];

export function findCommunity(id: string): CommunityData | undefined {
  return COMMUNITIES.find((c) => c.id === id);
}
