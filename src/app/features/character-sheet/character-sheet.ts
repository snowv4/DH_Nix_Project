import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnInit,
  output,
  signal,
  Signal,
} from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { findClass, TRAIT_LABELS } from '../../core/data/classes';
import { CharacterRepository } from '../../core/firebase/character.repository';
import { Character, CharacterPatch, Gold, TRAIT_IDS, TraitId } from '../../core/models/character';
import { clamp, toggleSlot } from '../../core/rules/character';
import { ResourceTrack } from '../../shared/ui/resource-track';
import { DiceRollerDialog, DiceRollerData } from '../dice/dice-roller-dialog';
import { EditSheetDialog } from './edit-sheet-dialog';

type Tab = 'main' | 'traits' | 'gear' | 'cards' | 'notes';

@Component({
  selector: 'app-character-sheet',
  imports: [ResourceTrack],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './character-sheet.html',
})
export class CharacterSheet implements OnInit {
  readonly characterId = input.required<string>();
  /** Shown in the header (e.g. "Sair" for players, "Fechar" in the GM popup). */
  readonly exitLabel = input('Sair');
  readonly exit = output<void>();

  private readonly repo = inject(CharacterRepository);
  private readonly dialog = inject(Dialog);
  private readonly destroyRef = inject(DestroyRef);

  protected character!: Signal<Character | null | undefined>;
  protected readonly tab = signal<Tab>('main');
  protected readonly tabs: { id: Tab; label: string }[] = [
    { id: 'main', label: 'Principal' },
    { id: 'traits', label: 'Atributos' },
    { id: 'gear', label: 'Equipamento' },
    { id: 'cards', label: 'Cartas' },
    { id: 'notes', label: 'Notas' },
  ];
  protected readonly coins: { id: keyof Gold; label: string }[] = [
    { id: 'handfuls', label: 'Punhados' },
    { id: 'bags', label: 'Sacolas' },
    { id: 'chests', label: 'Baús' },
  ];
  protected readonly traitIds = TRAIT_IDS;
  protected readonly traitLabels = TRAIT_LABELS;

  protected readonly className = computed(() => {
    const c = this.character?.();
    return c ? (findClass(c.classId)?.name ?? '') : '';
  });

  ngOnInit(): void {
    this.character = this.repo.watch(this.characterId(), this.destroyRef);
  }

  /** On phones only the active tab is shown; from `lg` up every section is visible side by side. */
  protected hiddenUnless(t: Tab): string {
    return this.tab() === t ? '' : 'max-lg:hidden';
  }

  protected save(patch: CharacterPatch): void {
    void this.repo.update(this.characterId(), patch);
  }

  protected tapHope(c: Character, index: number): void {
    const next = toggleSlot({ max: c.hope.max, marked: c.hope.current }, index).marked;
    this.save({ hope: { ...c.hope, current: next } });
  }

  protected tapHp(c: Character, index: number): void {
    this.save({ hp: toggleSlot(c.hp, index) });
  }

  protected tapStress(c: Character, index: number): void {
    this.save({ stress: toggleSlot(c.stress, index) });
  }

  protected tapArmor(c: Character, index: number): void {
    const next = toggleSlot({ max: c.armor.score, marked: c.armor.slotsMarked }, index).marked;
    this.save({ armor: { ...c.armor, slotsMarked: next } });
  }

  protected saveText(field: 'items' | 'features' | 'notes', current: string, event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    if (value !== current) this.save({ [field]: value });
  }

  protected saveCards(c: Character, field: 'loadout' | 'vault', event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    if (value !== c.domainCards[field])
      this.save({ domainCards: { ...c.domainCards, [field]: value } });
  }

  protected stepGold(c: Character, coin: keyof Gold, delta: number): void {
    this.save({ gold: { ...c.gold, [coin]: clamp(c.gold[coin] + delta, 0, 99) } });
  }

  protected origin(c: Character): string {
    return [c.ancestry, c.community, c.pronouns].filter((s) => s.trim()).join(' · ');
  }

  protected signed(n: number): string {
    return n > 0 ? `+${n}` : `${n}`;
  }

  protected roll(c: Character, trait?: TraitId): void {
    this.dialog.open<void, DiceRollerData>(DiceRollerDialog, {
      data: { character: c, trait },
      width: '28rem',
      maxWidth: 'calc(100vw - 1.5rem)',
    });
  }

  protected edit(c: Character): void {
    this.dialog.open<void, Character>(EditSheetDialog, {
      data: c,
      width: '40rem',
      maxWidth: 'calc(100vw - 1.5rem)',
      maxHeight: 'calc(100dvh - 1.5rem)',
    });
  }
}
