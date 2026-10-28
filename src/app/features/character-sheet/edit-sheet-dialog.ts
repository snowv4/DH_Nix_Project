import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import {
  FormArray,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CLASSES, findClass, TRAIT_LABELS } from '../../core/data/classes';
import { CharacterRepository } from '../../core/firebase/character.repository';
import { Character, TRAIT_IDS } from '../../core/models/character';
import { clamp } from '../../core/rules/character';

@Component({
  selector: 'app-edit-sheet-dialog',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './edit-sheet-dialog.html',
})
export class EditSheetDialog {
  private readonly c = inject<Character>(DIALOG_DATA);
  protected readonly ref = inject(DialogRef);
  private readonly repo = inject(CharacterRepository);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly classes = CLASSES;
  protected readonly traitIds = TRAIT_IDS;
  protected readonly traitLabels = TRAIT_LABELS;
  protected readonly saving = signal(false);

  private readonly num = (v: number, min = 0, max = 99) =>
    this.fb.control(v, [Validators.min(min), Validators.max(max)]);

  protected readonly form = this.fb.group({
    pronouns: this.c.pronouns,
    level: this.num(this.c.level, 1, 10),
    classId: this.c.classId,
    subclass: this.c.subclass,
    ancestry: this.c.ancestry,
    community: this.c.community,
    traits: this.fb.group({
      agility: this.num(this.c.traits.agility, -9, 9),
      strength: this.num(this.c.traits.strength, -9, 9),
      finesse: this.num(this.c.traits.finesse, -9, 9),
      instinct: this.num(this.c.traits.instinct, -9, 9),
      presence: this.num(this.c.traits.presence, -9, 9),
      knowledge: this.num(this.c.traits.knowledge, -9, 9),
    }),
    evasion: this.num(this.c.evasion),
    proficiency: this.num(this.c.proficiency, 1, 9),
    hpMax: this.num(this.c.hp.max, 1, 20),
    stressMax: this.num(this.c.stress.max, 1, 20),
    hopeMax: this.num(this.c.hope.max, 1, 12),
    armorName: this.c.armor.name,
    armorScore: this.num(this.c.armor.score, 0, 12),
    major: this.num(this.c.thresholds.major),
    severe: this.num(this.c.thresholds.severe),
    primaryWeapon: this.c.primaryWeapon,
    secondaryWeapon: this.c.secondaryWeapon,
    experiences: this.fb.array(
      this.c.experiences.map((e) => this.experienceGroup(e.name, e.bonus)),
    ),
  });

  protected get experiences(): FormArray<
    FormGroup<{ name: FormControl<string>; bonus: FormControl<number> }>
  > {
    return this.form.controls.experiences;
  }

  protected addExperience(): void {
    this.experiences.push(this.experienceGroup('', 2));
  }

  /** Picking a class on a fresh sheet pre-fills its starting Evasion and HP. */
  protected onClassChange(): void {
    const info = findClass(this.form.controls.classId.value);
    if (!info || this.c.classId) return;
    this.form.patchValue({ evasion: info.startingEvasion, hpMax: info.startingHp });
  }

  protected async save(): Promise<void> {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.saving.set(true);
    try {
      await this.repo.update(this.c.id, {
        pronouns: v.pronouns,
        level: v.level,
        classId: v.classId,
        subclass: v.subclass,
        ancestry: v.ancestry,
        community: v.community,
        traits: v.traits,
        evasion: v.evasion,
        proficiency: v.proficiency,
        hp: { max: v.hpMax, marked: clamp(this.c.hp.marked, 0, v.hpMax) },
        stress: { max: v.stressMax, marked: clamp(this.c.stress.marked, 0, v.stressMax) },
        hope: { max: v.hopeMax, current: clamp(this.c.hope.current, 0, v.hopeMax) },
        armor: {
          name: v.armorName,
          score: v.armorScore,
          slotsMarked: clamp(this.c.armor.slotsMarked, 0, v.armorScore),
        },
        thresholds: { major: v.major, severe: v.severe },
        primaryWeapon: v.primaryWeapon,
        secondaryWeapon: v.secondaryWeapon,
        experiences: v.experiences.filter((e) => e.name.trim()),
      });
      this.ref.close();
    } finally {
      this.saving.set(false);
    }
  }

  private experienceGroup(name: string, bonus: number) {
    return this.fb.group({ name, bonus: this.num(bonus, -9, 9) });
  }
}
