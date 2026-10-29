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
import { RouterLink } from '@angular/router';
import { CampaignRepository } from '../../core/firebase/campaign.repository';
import { canLevelUp, undoLastLevel } from '../../core/rules/leveling';
import { DOMAIN_CARDS, DOMAINS, DomainCard, findCard, findClass } from '../../core/data/srd';
import { TRAIT_COLORS, TRAIT_LABELS } from '../../core/data/traits';
import { CardArtRepository } from '../../core/firebase/card-art.repository';
import { CharacterRepository } from '../../core/firebase/character.repository';
import {
  Character,
  CharacterPatch,
  Gold,
  OwnedCard,
  TRAIT_IDS,
  TraitId,
} from '../../core/models/character';
import { clamp, toggleSlot } from '../../core/rules/character';
import { DamageThresholds } from '../../shared/ui/damage-thresholds';
import { PortraitFrame } from '../../shared/ui/portrait-frame';
import { resizeImageToDataUrl } from '../../shared/ui/resize-image';
import { RichText } from '../../shared/ui/rich-text';
import { ResourceTrack } from '../../shared/ui/resource-track';
import { DomainCardBlock } from './domain-card-block';
import { EditSheetDialog } from './edit-sheet-dialog';

type TextField = 'items' | 'features' | 'notes' | 'appearance' | 'background' | 'connections';

type Tab = 'main' | 'traits' | 'gear' | 'cards' | 'notes';

@Component({
  selector: 'app-character-sheet',
  imports: [ResourceTrack, PortraitFrame, DamageThresholds, DomainCardBlock, RichText, RouterLink],
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
  private readonly cardArtRepo = inject(CardArtRepository);
  /** Shared art for every card, uploaded by anyone at the table. */
  protected readonly cardArt = this.cardArtRepo.watchAll(this.destroyRef);
  protected readonly editingFeatures = signal(false);
  private readonly campaign = inject(CampaignRepository).watchCampaign(this.destroyRef);

  /** The GM released a higher level than this character has. */
  protected readonly canLevel = computed(() => {
    const c = this.character?.();
    return !!c && canLevelUp(c, this.campaign().levelUnlocked ?? 1);
  });
  protected readonly lastLevel = computed(
    () => this.character?.()?.levelHistory?.at(-1)?.level ?? 0,
  );

  protected undoLevel(c: Character): void {
    const patch = undoLastLevel(c);
    if (
      !patch ||
      !window.confirm(`Desfazer o nível ${c.level}? As escolhas desse nível serão apagadas.`)
    )
      return;
    this.save(patch);
  }

  /** Features text → blocks separated by blank lines; "Category — Title" first lines become headings. */
  protected readonly featureBlocks = computed(() =>
    (this.character?.()?.features ?? '')
      .split(/\n\s*\n/)
      .map((block) => block.trim())
      .filter(Boolean)
      .map((block) => {
        const [first, ...rest] = block.split('\n');
        const dash = first.indexOf(' — ');
        if (dash > 0 && rest.length) {
          return {
            category: first.slice(0, dash),
            title: first.slice(dash + 3),
            body: rest.join('\n'),
          };
        }
        return { category: '', title: '', body: block };
      }),
  );

  protected character!: Signal<Character | null | undefined>;
  protected readonly tab = signal<Tab>('main');
  protected readonly tabs: { id: Tab; label: string }[] = [
    { id: 'main', label: 'Principal' },
    { id: 'traits', label: 'Atributos' },
    { id: 'gear', label: 'Equipamento' },
    { id: 'cards', label: 'Cartas' },
    { id: 'notes', label: 'Notas e história' },
  ];
  protected readonly coins: { id: keyof Gold; label: string }[] = [
    { id: 'handfuls', label: 'Punhados' },
    { id: 'bags', label: 'Sacolas' },
    { id: 'chests', label: 'Baús' },
  ];
  protected readonly storyFields: {
    id: 'appearance' | 'background' | 'connections';
    label: string;
    placeholder: string;
  }[] = [
    { id: 'appearance', label: 'Aparência', placeholder: 'Como seu personagem é?' },
    { id: 'background', label: 'História', placeholder: 'Perguntas de história e respostas' },
    { id: 'connections', label: 'Vínculos', placeholder: 'Relações com o grupo' },
  ];
  protected readonly traitIds = TRAIT_IDS;
  protected readonly traitLabels = TRAIT_LABELS;
  protected readonly traitColors = TRAIT_COLORS;
  protected readonly domains = DOMAINS;
  /** SRD: up to five domain cards in the loadout at once. */
  protected readonly maxActive = 5;
  protected readonly portraitBusy = signal(false);
  protected readonly portraitError = signal('');
  protected readonly cardError = signal('');

  /** Owned SRD cards, active ones first. */
  protected readonly ownedCards = computed(() => {
    const owned = this.character?.()?.cards ?? [];
    return owned
      .map((o) => ({ card: findCard(o.id), active: o.active }))
      .filter((o): o is { card: DomainCard; active: boolean } => !!o.card)
      .sort((a, b) => Number(b.active) - Number(a.active));
  });
  protected readonly activeCount = computed(() => this.ownedCards().filter((o) => o.active).length);

  /** Cards not owned yet, from the class domains when the class is known. */
  protected readonly addableCards = computed(() => {
    const c = this.character?.();
    const owned = new Set((c?.cards ?? []).map((o) => o.id));
    const domains = c ? findClass(c.classId)?.domains : undefined;
    return DOMAIN_CARDS.filter(
      (card) => !owned.has(card.id) && (!domains || domains.includes(card.domain)),
    );
  });

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

  protected saveText(field: TextField, current: string, event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    if (value !== current) this.save({ [field]: value });
  }

  protected saveCards(c: Character, field: 'loadout' | 'vault', event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    if (value !== c.domainCards[field])
      this.save({ domainCards: { ...c.domainCards, [field]: value } });
  }

  protected async setPortrait(file: File): Promise<void> {
    this.portraitBusy.set(true);
    this.portraitError.set('');
    try {
      this.save({ portraitUrl: await resizeImageToDataUrl(file) });
    } catch (e: unknown) {
      console.error(e);
      this.portraitError.set('Não consegui usar essa imagem. Tente outra (JPG ou PNG).');
    } finally {
      this.portraitBusy.set(false);
    }
  }

  protected async setCardArt(cardId: string, file: File): Promise<void> {
    this.cardError.set('');
    try {
      await this.cardArtRepo.set(cardId, await resizeImageToDataUrl(file, 640, 0.78));
    } catch (e: unknown) {
      console.error(e);
      this.cardError.set('Não consegui usar essa imagem. Tente outra (JPG ou PNG).');
    }
  }

  protected removeCardArt(cardId: string): void {
    void this.cardArtRepo.remove(cardId);
  }

  /** Light tint per trait: colored border and a faint wash of the same color. */
  protected traitStyle(t: TraitId): string {
    const color = TRAIT_COLORS[t];
    return `border-color: color-mix(in srgb, ${color} 55%, transparent); background: color-mix(in srgb, ${color} 12%, var(--color-panel-2));`;
  }

  protected saveExperienceNote(c: Character, index: number, event: Event): void {
    const note = (event.target as HTMLTextAreaElement).value.trim();
    if (note === (c.experiences[index]?.note ?? '')) return;
    this.save({ experiences: c.experiences.map((e, i) => (i === index ? { ...e, note } : e)) });
  }

  protected toggleCard(c: Character, id: string): void {
    const cards = c.cards ?? [];
    const target = cards.find((o) => o.id === id);
    if (!target) return;
    if (!target.active && cards.filter((o) => o.active).length >= this.maxActive) {
      this.cardError.set(
        `A mão já tem ${this.maxActive} cartas ativas. Mande uma para o cofre antes.`,
      );
      return;
    }
    this.cardError.set('');
    this.saveCardList(cards.map((o) => (o.id === id ? { ...o, active: !o.active } : o)));
  }

  protected removeCard(c: Character, id: string): void {
    this.cardError.set('');
    this.saveCardList((c.cards ?? []).filter((o) => o.id !== id));
  }

  protected addCard(c: Character, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const id = select.value;
    select.value = '';
    if (!id) return;
    const cards = c.cards ?? [];
    const active = cards.filter((o) => o.active).length < this.maxActive;
    this.saveCardList([...cards, { id, active }]);
  }

  private saveCardList(cards: OwnedCard[]): void {
    this.save({ cards });
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

  protected edit(c: Character): void {
    this.dialog.open<void, Character>(EditSheetDialog, {
      data: c,
      width: '40rem',
      maxWidth: 'calc(100vw - 1.5rem)',
      maxHeight: 'calc(100dvh - 1.5rem)',
    });
  }
}
