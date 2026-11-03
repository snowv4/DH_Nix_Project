import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  ADVERSARY_BENCHMARKS,
  ADVERSARY_EXAMPLE_EXPERIENCES,
  ADVERSARY_TYPES,
  RANGE_LABELS,
} from '../../core/data/srd';
import { NpcRepository } from '../../core/firebase/npc.repository';
import { Npc } from '../../core/models/npc';
import { clamp } from '../../core/rules/character';
import { NAME_STYLES, NameStyle, randomName } from '../../core/rules/names';
import { PortraitFrame } from '../../shared/ui/portrait-frame';
import { IconPicker } from '../../shared/ui/icon-picker';
import { resizeImageToDataUrl } from '../../shared/ui/resize-image';

/** Create/edit an NPC or adversary. Data = the NPC (new ones come pre-filled). */
@Component({
  selector: 'app-npc-dialog',
  imports: [ReactiveFormsModule, PortraitFrame, IconPicker],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './npc-dialog.html',
})
export class NpcDialog {
  private readonly npc = inject<Npc>(DIALOG_DATA);
  protected readonly ref = inject(DialogRef);
  private readonly repo = inject(NpcRepository);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly types = ADVERSARY_TYPES;
  protected readonly ranges = Object.entries(RANGE_LABELS);
  protected readonly nameStyles = NAME_STYLES;
  protected readonly exampleExperiences = ADVERSARY_EXAMPLE_EXPERIENCES;
  protected readonly nameStyle = signal<NameStyle>('human');
  protected readonly portrait = signal(this.npc.portraitUrl);
  protected readonly icon = signal(this.npc.icon ?? '');
  protected readonly saving = signal(false);
  protected readonly isNew = !this.npc.updatedAt;

  private readonly num = (v: number, min = 0, max = 999) =>
    this.fb.control(v, [Validators.min(min), Validators.max(max)]);

  protected readonly form = this.fb.group({
    name: [this.npc.name, Validators.required],
    type: this.npc.type,
    tier: this.num(this.npc.tier, 1, 4),
    difficulty: this.num(this.npc.difficulty),
    major: this.num(this.npc.thresholds.major),
    severe: this.num(this.npc.thresholds.severe),
    hpMax: this.num(this.npc.hp.max, 0, 40),
    stressMax: this.num(this.npc.stress.max, 0, 20),
    attackModifier: this.num(this.npc.attack.modifier, -10, 20),
    attackName: this.npc.attack.name,
    attackRange: this.npc.attack.range,
    attackDamage: this.npc.attack.damage,
    experiences: this.npc.experiences,
    features: this.npc.features,
    description: this.npc.description,
    motives: this.npc.motives,
    notes: this.npc.notes,
    tags: this.npc.tags,
  });

  protected rollName(): void {
    this.form.controls.name.setValue(randomName(this.nameStyle()));
  }

  protected setStyle(e: Event): void {
    this.nameStyle.set((e.target as HTMLSelectElement).value as NameStyle);
  }

  /** Changing the tier pre-fills the SRD benchmark numbers (difficulty, thresholds, attack). */
  protected applyTierBenchmarks(): void {
    const tier = clamp(this.form.controls.tier.value, 1, 4) as 1 | 2 | 3 | 4;
    const b = ADVERSARY_BENCHMARKS[tier];
    this.form.patchValue({
      difficulty: b.difficulty,
      major: b.major,
      severe: b.severe,
      attackModifier: b.attack,
    });
  }

  protected benchmarkDamage(): string {
    const tier = clamp(this.form.controls.tier.value, 1, 4) as 1 | 2 | 3 | 4;
    return ADVERSARY_BENCHMARKS[tier].damage;
  }

  protected addExperience(e: string): void {
    const cur = this.form.controls.experiences.value.trim();
    this.form.controls.experiences.setValue(cur ? `${cur}\n${e} +2` : `${e} +2`);
  }

  protected async pickPortrait(file: File): Promise<void> {
    this.portrait.set(await resizeImageToDataUrl(file));
  }

  protected async save(): Promise<void> {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.saving.set(true);
    try {
      await this.repo.save({
        ...this.npc,
        name: v.name.trim(),
        type: v.type,
        tier: v.tier,
        difficulty: v.difficulty,
        thresholds: { major: v.major, severe: v.severe },
        hp: { max: v.hpMax, marked: clamp(this.npc.hp.marked, 0, v.hpMax) },
        stress: { max: v.stressMax, marked: clamp(this.npc.stress.marked, 0, v.stressMax) },
        attack: {
          modifier: v.attackModifier,
          name: v.attackName,
          range: v.attackRange,
          damage: v.attackDamage,
        },
        experiences: v.experiences,
        features: v.features,
        description: v.description,
        motives: v.motives,
        notes: v.notes,
        tags: v.tags,
        portraitUrl: this.portrait(),
        icon: this.icon(),
      });
      this.ref.close();
    } finally {
      this.saving.set(false);
    }
  }
}
