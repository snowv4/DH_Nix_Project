import { parseLine } from './rich-text';

describe('parseLine', () => {
  it('highlights "Name: effect" lines (grimoire spells)', () => {
    expect(parseLine('Empurrão de Poder: faça uma rolagem de Conjuração.')).toEqual({
      kind: 'named',
      name: 'Empurrão de Poder',
      text: 'Faça uma rolagem de Conjuração.',
    });
  });

  it('keeps sentences with a trailing colon as plain text', () => {
    expect(parseLine('Faça uma rolagem de Conjuração contra um alvo. Em sucesso:').kind).toBe(
      'plain',
    );
  });

  it('turns bullets into list items, with an optional name', () => {
    expect(parseLine('• Patamar 1: 9/19')).toEqual({
      kind: 'bullet',
      name: 'Patamar 1',
      text: '9/19',
    });
    expect(parseLine('• O aliado ganha 1 Esperança.')).toEqual({
      kind: 'bullet',
      name: '',
      text: 'O aliado ganha 1 Esperança.',
    });
  });
});
