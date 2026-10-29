import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  OnInit,
  signal,
  Signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { COMPANION_UPGRADES, DOMAIN_CARDS, DOMAINS, DomainCard } from '../../core/data/srd';
import { TRAIT_LABELS } from '../../core/data/traits';
import { CampaignRepository } from '../../core/firebase/campaign.repository';
import { CharacterRepository } from '../../core/firebase/character.repository';
import { Character, TraitId } from '../../core/models/character';
import {
  AdvancementPick,
  ADVANCEMENT_POINTS,
  applyLevelUp,
  availableAdvancements,
  canLevelUp,
  cardChoices,
  emptyChoices,
  hasTierAchievement,
  LevelUpChoices,
  levelUpError,
  needsCompanion,
  needsStance,
  pointsSpent,
  stanceChoices,
  tierOf,
  unmarkedTraits,
} from '../../core/rules/leveling';
import { LicenseNotice } from '../../shared/ui/license-notice';
import { RichText } from '../../shared/ui/rich-text';

type StepId = 'achievement' | 'advancements' | 'class' | 'card' | 'review';

const STEP_LABELS: Record<StepId, string> = {
  achievement: 'Conquista de patamar',
  advancements: 'Avanços',
  class: 'Escolhas da classe',
  card: 'Nova carta',
  review: 'Revisão',
};

/** `/ficha/:id/nivel` — guided level-up (spec 4.4), one step per screen like character creation. */
@Component({
  selector: 'app-level-up-page',
  imports: [RichText, LicenseNotice],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './level-up-page.html',
})
export class LevelUpPage implements OnInit {
  readonly id = input.required<string>();

  private readonly repo = inject(CharacterRepository);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly campaign = inject(CampaignRepository).watchCampaign(this.destroyRef);

  protected character!: Signal<Character | null | undefined>;
  protected readonly choices = signal<LevelUpChoices>(emptyChoices());
  protected readonly stepIndex = signal(0);
  protected readonly saving = signal(false);
  protected readonly saveError = signal('');

  protected readonly traitLabels = TRAIT_LABELS;
  protected readonly domains = DOMAINS;
  protected readonly companionUpgrades = COMPANION_UPGRADES;
  protected readonly totalPoints = ADVANCEMENT_POINTS;

  protected readonly newLevel = computed(() => (this.character?.()?.level ?? 0) + 1);
  protected readonly tier = computed(() => tierOf(this.newLevel()));

  protected readonly steps = computed<StepId[]>(() => {
    const c = this.character?.();
    if (!c) return ['review'];
    const list: StepId[] = [];
    if (hasTierAchievement(this.newLevel())) list.push('achievement');
    list.push('advancements');
    if (needsStance(c) || needsCompanion(c)) list.push('class');
    list.push('card', 'review');
    return list;
  });
  protected readonly step = computed(
    () => this.steps()[Math.min(this.stepIndex(), this.steps().length - 1)],
  );
  protected readonly stepLabel = computed(() => STEP_LABELS[this.step()]);

  protected readonly options = computed(() => {
    const c = this.character?.();
    return c ? availableAdvancements(c, this.newLevel()) : [];
  });
  protected readonly spent = computed(() => pointsSpent(this.choices().advancements));
  protected readonly freeTraits = computed(() => {
    const c = this.character?.();
    return c ? unmarkedTraits(c, this.newLevel()) : [];
  });
  /** Current Experiences plus the one from the tier achievement, for the "+1 to two" pick. */
  protected readonly experienceNames = computed(() => {
    const c = this.character?.();
    const names = (c?.experiences ?? []).map((e) => e.name);
    if (hasTierAchievement(this.newLevel()))
      names.push(this.choices().newExperience.name || 'Nova Experiência');
    return names;
  });
  protected readonly stances = computed(() => {
    const c = this.character?.();
    return c ? stanceChoices(c, this.newLevel()) : [];
  });
  protected readonly isStanceUser = computed(() => {
    const c = this.character?.();
    return !!c && needsStance(c);
  });
  protected readonly isCompanionUser = computed(() => {
    const c = this.character?.();
    return !!c && needsCompanion(c);
  });

  /** Error shown in the footer; only the parts relevant to the current step block "Próximo". */
  protected readonly stepError = computed(() => {
    const c = this.character?.();
    if (!c) return '';
    const ch = this.choices();
    switch (this.step()) {
      case 'achievement':
        return ch.newExperience.name.trim() ? '' : 'Escreva a nova Experiência.';
      case 'advancements': {
        const left = ADVANCEMENT_POINTS - this.spent();
        if (left > 0) return `Escolha mais ${left} avanço${left > 1 ? 's' : ''}.`;
        for (const p of ch.advancements) {
          if (p.id === 'traits' && p.traits.length !== 2) return 'Escolha os dois atributos.';
          if (p.id === 'experiences' && p.indexes.length !== 2)
            return 'Escolha as duas Experiências.';
          if (p.id === 'domainCard' && !p.cardId) return 'Escolha a carta extra.';
        }
        return '';
      }
      case 'class':
        if (needsStance(c) && !ch.stanceId) return 'Escolha uma postura.';
        if (needsCompanion(c) && !ch.companionUpgradeId)
          return 'Escolha uma melhoria para o companheiro.';
        return '';
      case 'card':
        return ch.newCardId ? '' : 'Escolha a nova carta.';
      case 'review':
        return levelUpError(c, this.newLevel(), ch) ?? '';
    }
  });

  protected readonly preview = computed(() => {
    const c = this.character?.();
    if (!c || this.step() !== 'review' || levelUpError(c, this.newLevel(), this.choices()))
      return null;
    return applyLevelUp(c, this.newLevel(), this.choices());
  });

  constructor() {
    // Leave if the GM hasn't released this level (or it was already applied in another tab).
    effect(() => {
      const c = this.character?.();
      if (c === null) void this.router.navigateByUrl('/');
      if (c && !this.saving() && !canLevelUp(c, this.campaign().levelUnlocked ?? 1)) {
        void this.router.navigate(['/ficha', c.id]);
      }
    });
  }

  ngOnInit(): void {
    this.character = this.repo.watch(this.id(), this.destroyRef);
  }

  // ---------- Advancements ----------

  protected taking(id: string): number {
    return this.choices().advancements.filter((p) => p.id === id).length;
  }

  protected slots(total: number, used: number, taking: number): ('used' | 'taking' | 'free')[] {
    return Array.from({ length: total }, (_, i) =>
      i < used ? 'used' : i < used + taking ? 'taking' : 'free',
    );
  }

  protected canAdd(id: string, total: number, used: number, cost: number): boolean {
    return used + this.taking(id) < total && this.spent() + cost <= ADVANCEMENT_POINTS;
  }

  protected add(id: AdvancementPick['id']): void {
    const pick: AdvancementPick =
      id === 'traits'
        ? { id, traits: [] }
        : id === 'experiences'
          ? { id, indexes: [] }
          : id === 'domainCard'
            ? { id, cardId: '' }
            : { id };
    this.patch({ advancements: [...this.choices().advancements, pick] });
  }

  protected removeOne(id: string): void {
    const list = [...this.choices().advancements];
    const i = list.map((p) => p.id).lastIndexOf(id as AdvancementPick['id']);
    if (i >= 0) list.splice(i, 1);
    this.patch({ advancements: list });
  }

  protected toggleTrait(pickIndex: number, t: TraitId): void {
    this.updatePick(pickIndex, (p) => {
      if (p.id !== 'traits') return p;
      const has = p.traits.includes(t);
      const traits = has ? p.traits.filter((x) => x !== t) : [...p.traits, t].slice(-2);
      return { ...p, traits };
    });
  }

  protected toggleExperience(pickIndex: number, i: number): void {
    this.updatePick(pickIndex, (p) => {
      if (p.id !== 'experiences') return p;
      const has = p.indexes.includes(i);
      return {
        ...p,
        indexes: has ? p.indexes.filter((x) => x !== i) : [...p.indexes, i].slice(-2),
      };
    });
  }

  protected setExtraCard(pickIndex: number, e: Event): void {
    const cardId = (e.target as HTMLSelectElement).value;
    this.updatePick(pickIndex, (p) => (p.id === 'domainCard' ? { ...p, cardId } : p));
  }

  /** Cards for an extra-card pick: valid cards minus the ones chosen in other picks / the main card. */
  protected extraCardOptions(pickIndex: number): DomainCard[] {
    const c = this.character?.();
    if (!c) return [];
    const others = this.choices()
      .advancements.flatMap((p, i) => (p.id === 'domainCard' && i !== pickIndex ? [p.cardId] : []))
      .concat(this.choices().newCardId);
    return cardChoices(c, this.newLevel(), DOMAIN_CARDS, others.filter(Boolean));
  }

  protected readonly newCardOptions = computed(() => {
    const c = this.character?.();
    if (!c) return [];
    const extras = this.choices().advancements.flatMap((p) =>
      p.id === 'domainCard' ? [p.cardId] : [],
    );
    return cardChoices(c, this.newLevel(), DOMAIN_CARDS, extras.filter(Boolean));
  });

  // ---------- Generic ----------

  protected patch(p: Partial<LevelUpChoices>): void {
    this.choices.update((c) => ({ ...c, ...p }));
  }

  protected value(e: Event): string {
    return (e.target as HTMLInputElement).value;
  }

  protected next(): void {
    if (this.stepError()) return;
    this.stepIndex.update((i) => Math.min(this.steps().length - 1, i + 1));
    window.scrollTo({ top: 0 });
  }

  protected back(): void {
    if (this.stepIndex() === 0) {
      void this.router.navigate(['/ficha', this.id()]);
      return;
    }
    this.stepIndex.update((i) => i - 1);
    window.scrollTo({ top: 0 });
  }

  protected async apply(): Promise<void> {
    const c = this.character?.();
    if (!c || levelUpError(c, this.newLevel(), this.choices())) return;
    this.saving.set(true);
    this.saveError.set('');
    try {
      await this.repo.update(c.id, applyLevelUp(c, this.newLevel(), this.choices()));
      await this.router.navigate(['/ficha', c.id]);
    } catch (e: unknown) {
      console.error(e);
      this.saveError.set('Não consegui salvar. Confira a internet e tente de novo.');
      this.saving.set(false);
    }
  }

  private updatePick(index: number, fn: (p: AdvancementPick) => AdvancementPick): void {
    this.patch({
      advancements: this.choices().advancements.map((p, i) => (i === index ? fn(p) : p)),
    });
  }
}
