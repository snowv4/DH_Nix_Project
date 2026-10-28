import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TRAIT_LABELS } from '../../core/data/classes';
import { CampaignRepository } from '../../core/firebase/campaign.repository';
import { CharacterRepository } from '../../core/firebase/character.repository';
import { Character, TRAIT_IDS, TraitId } from '../../core/models/character';
import { clamp } from '../../core/rules/character';
import {
  AdvantageMode,
  dualityEffects,
  DualityResult,
  outcomeLabel,
  rollDuality,
} from '../../core/rules/dice';

export interface DiceRollerData {
  character: Character;
  trait?: TraitId;
}

@Component({
  selector: 'app-dice-roller-dialog',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dice-roller-dialog.html',
  styleUrl: './dice-roller-dialog.css',
})
export class DiceRollerDialog {
  protected readonly data = inject<DiceRollerData>(DIALOG_DATA);
  protected readonly ref = inject(DialogRef);
  private readonly characters = inject(CharacterRepository);
  private readonly campaign = inject(CampaignRepository);

  protected readonly traitIds = TRAIT_IDS;
  protected readonly traitLabels = TRAIT_LABELS;
  protected readonly character = this.data.character;
  /** Local copy of Hope/Stress so several rolls in one dialog chain correctly. */
  protected readonly hope = signal(this.character.hope.current);
  private stressMarked = this.character.stress.marked;
  protected readonly experiences = this.character.experiences.filter((e) => e.name);

  protected readonly form = new FormGroup({
    trait: new FormControl<TraitId | ''>(this.data.trait ?? '', { nonNullable: true }),
    experience: new FormControl<number>(-1, { nonNullable: true }),
    bonus: new FormControl<number>(0, { nonNullable: true }),
    advantage: new FormControl<AdvantageMode>('none', { nonNullable: true }),
    difficulty: new FormControl<number | null>(null),
  });

  protected readonly result = signal<DualityResult | null>(null);
  protected readonly label = computed(() => {
    const r = this.result();
    return r ? outcomeLabel(r) : '';
  });
  /** Bumped on every roll so the dice re-run their CSS animation. */
  protected readonly rollKey = signal(0);

  protected async roll(): Promise<void> {
    const v = this.form.getRawValue();
    const c = this.character;
    const traitMod = v.trait ? c.traits[v.trait] : 0;
    const exp = v.experience >= 0 ? this.experiences[v.experience] : undefined;
    // Using an Experience costs 1 Hope (spec 3.3).
    const hopeSpent = exp && this.hope() > 0 ? 1 : 0;
    const expBonus = hopeSpent ? (exp?.bonus ?? 0) : 0;

    const r = rollDuality({
      modifier: traitMod + expBonus + (v.bonus ?? 0),
      advantage: v.advantage,
      difficulty: v.difficulty ?? undefined,
    });
    this.result.set(r);
    this.rollKey.update((k) => k + 1);

    const fx = dualityEffects(r.outcome);
    this.hope.set(clamp(this.hope() - hopeSpent + fx.hopeGained, 0, c.hope.max));
    this.stressMarked = clamp(this.stressMarked - fx.stressCleared, 0, c.stress.max);

    const traitName = v.trait ? this.traitLabels[v.trait] : 'Dualidade';
    await Promise.all([
      this.characters.update(c.id, {
        hope: { ...c.hope, current: this.hope() },
        stress: { ...c.stress, marked: this.stressMarked },
      }),
      fx.fearGained ? this.campaign.adjustFear(fx.fearGained) : Promise.resolve(),
      this.campaign.logRoll({
        characterId: c.id,
        characterName: c.name,
        label: exp && hopeSpent ? `${traitName} + ${exp.name}` : traitName,
        hope: r.hope,
        fear: r.fear,
        total: r.total,
        outcome: r.outcome,
        createdAt: Date.now(),
      }),
    ]);
  }

  protected signed(n: number): string {
    return n > 0 ? `+${n}` : `${n}`;
  }
}
