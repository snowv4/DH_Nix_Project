import { DomainData, DomainId } from './types';

export const DOMAINS: Record<DomainId, DomainData> = {
  arcana: {
    id: 'arcana',
    name: 'Arcano',
    nameEn: 'Arcana',
    summary:
      'Magia inata e instintiva. Quem segue este caminho manipula as forças cruas e enigmáticas dos reinos para controlar a própria energia e os elementos. Volátil, mas muito potente quando bem canalizada.',
  },
  blade: {
    id: 'blade',
    name: 'Lâmina',
    nameEn: 'Blade',
    summary:
      'Maestria com armas. Seja com aço, arco ou algo mais exótico, seus seguidores dominam a arte de encerrar vidas e buscam um poder inexorável sobre a morte.',
  },
  bone: {
    id: 'bone',
    name: 'Osso',
    nameEn: 'Bone',
    summary:
      'Tática e corpo. Controle fora do comum das próprias capacidades físicas e um olhar afiado para prever o comportamento dos outros em combate.',
  },
  codex: {
    id: 'codex',
    name: 'Códice',
    nameEn: 'Codex',
    summary:
      'Estudo mágico intensivo. As equações do poder registradas em livros, pergaminhos, paredes ou tatuagens. Uma magia versátil para quem busca conhecimento além do comum.',
  },
  dread: {
    id: 'dread',
    name: 'Pavor',
    nameEn: 'Dread',
    summary:
      'Pesadelos e medo. Invoca monstruosidades, enfraquece inimigos e canaliza magias aterrorizantes — poderes que a maioria tem medo demais para usar.',
  },
  grace: {
    id: 'grace',
    name: 'Graça',
    nameEn: 'Grace',
    summary:
      'Carisma. Com histórias arrebatadoras, feitiços de encanto ou um véu de mentiras, quem canaliza este poder molda a realidade dos adversários e domina a linguagem.',
  },
  midnight: {
    id: 'midnight',
    name: 'Meia-Noite',
    nameEn: 'Midnight',
    summary:
      'Sombras e segredo. Truques espertos, magia sutil ou o manto da noite: a arte de se esconder, criar enigmas e descobrir tesouros escondidos.',
  },
  sage: {
    id: 'sage',
    name: 'Sábio',
    nameEn: 'Sage',
    summary:
      'O mundo natural. O poder da terra e das criaturas, com a vitalidade de uma flor desabrochando e a ferocidade de um predador faminto.',
  },
  splendor: {
    id: 'splendor',
    name: 'Esplendor',
    nameEn: 'Splendor',
    summary:
      'A vida. Magia de cura e, até certo ponto, de controle sobre a morte: o poder magnífico de dar e de tirar a vida.',
  },
  valor: {
    id: 'valor',
    name: 'Valor',
    nameEn: 'Valor',
    summary:
      'Proteção. No ataque ou na defesa, quem segue esta disciplina canaliza uma força formidável para proteger os aliados em batalha.',
  },
};
