import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import {
  FormArray,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  ANCESTRIES,
  ARMORS,
  CLASSES,
  COMMUNITIES,
  findArmor,
  findClass,
  findWeapon,
  PRIMARY_WEAPONS,
  SECONDARY_WEAPONS,
  Weapon,
} from '../../core/data/srd';
import { describeWeapon } from '../../core/rules/creation';
import {
  armorDisplayName,
  parseArmorName,
  parseWeaponText,
  swapArmor,
} from '../../core/rules/gear';
import { TRAIT_LABELS } from '../../core/data/traits';
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

  // ---------- Equipment dropdowns (choice = weapon id, '' = none, 'custom' = free text) ----------
  protected readonly primaryGroups = groupWeapons(PRIMARY_WEAPONS);
  protected readonly secondaryWeapons = SECONDARY_WEAPONS;
  protected readonly armors = ARMORS;
  protected readonly weaponSlots: {
    key: 'primary' | 'secondary';
    label: string;
    control: 'primaryWeapon' | 'secondaryWeapon';
  }[] = [
    { key: 'primary', label: 'Arma primária', control: 'primaryWeapon' },
    { key: 'secondary', label: 'Arma secundária', control: 'secondaryWeapon' },
  ];
  protected readonly gear = {
    primary: signal(initialWeapon(this.c.primaryWeapon)),
    secondary: signal(initialWeapon(this.c.secondaryWeapon)),
  };
  protected readonly armorChoice = signal(initialArmor(this.c.armor.name));
  /** Spellcast trait of the current subclass, for "Spellcast" weapons. */
  private readonly cast = findClass(this.c.classId)?.subclasses.find(
    (s) => s.name === this.c.subclass,
  )?.spellcastTrait;

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
      this.c.experiences.map((e) => this.experienceGroup(e.name, e.bonus, e.note ?? '')),
    ),
  });

  protected pickWeapon(slot: 'primary' | 'secondary', e: Event): void {
    const choice = (e.target as HTMLSelectElement).value;
    this.gear[slot].update((g) => ({ ...g, choice }));
    this.writeWeapon(slot);
  }

  protected setWeaponReskin(slot: 'primary' | 'secondary', e: Event): void {
    const reskin = (e.target as HTMLInputElement).value;
    this.gear[slot].update((g) => ({ ...g, reskin }));
    this.writeWeapon(slot);
  }

  protected toggleWeaponReskin(slot: 'primary' | 'secondary'): void {
    this.gear[slot].update((g) => ({
      ...g,
      reskinOpen: !g.reskinOpen,
      reskin: g.reskinOpen ? '' : g.reskin,
    }));
    this.writeWeapon(slot);
  }

  /** The sheet keeps weapons as text; the dropdown just writes the right text into the form. */
  private writeWeapon(slot: 'primary' | 'secondary'): void {
    const g = this.gear[slot]();
    const control =
      slot === 'primary' ? this.form.controls.primaryWeapon : this.form.controls.secondaryWeapon;
    if (g.choice === 'custom') return;
    const w = findWeapon(g.choice);
    control.setValue(w ? describeWeapon(w, this.cast, g.reskin) : '');
  }

  protected pickArmor(e: Event): void {
    const choice = (e.target as HTMLSelectElement).value;
    const prev = this.armorChoice();
    this.armorChoice.set({ ...prev, choice });
    if (choice === 'custom') return;
    const v = this.form.getRawValue();
    const next = swapArmor(
      { score: v.armorScore, major: v.major, severe: v.severe },
      findArmor(prev.choice) ?? null,
      findArmor(choice) ?? null,
      v.level,
    );
    const armor = findArmor(choice);
    this.form.patchValue({
      armorName: armor ? armorDisplayName(armor, prev.reskin) : '',
      armorScore: next.score,
      major: next.major,
      severe: next.severe,
    });
  }

  protected setArmorReskin(e: Event): void {
    const reskin = (e.target as HTMLInputElement).value;
    this.armorChoice.update((a) => ({ ...a, reskin }));
    const armor = findArmor(this.armorChoice().choice);
    if (armor) this.form.controls.armorName.setValue(armorDisplayName(armor, reskin));
  }

  protected toggleArmorReskin(): void {
    this.armorChoice.update((a) => ({
      ...a,
      reskinOpen: !a.reskinOpen,
      reskin: a.reskinOpen ? '' : a.reskin,
    }));
    const armor = findArmor(this.armorChoice().choice);
    if (armor)
      this.form.controls.armorName.setValue(armorDisplayName(armor, this.armorChoice().reskin));
  }

  // toSignal: turns the control's valueChanges stream into a signal so `computed` can react to it.
  private readonly classId = toSignal(this.form.controls.classId.valueChanges, {
    initialValue: this.c.classId,
  });

  /** Dropdown options; a custom value already on the sheet (e.g. "Gigante-Simiah") stays selectable. */
  protected readonly subclassOptions = computed(() =>
    withCurrent(findClass(this.classId())?.subclasses.map((s) => s.name) ?? [], this.c.subclass),
  );
  protected readonly ancestryOptions = withCurrent(
    ANCESTRIES.map((a) => a.name),
    this.c.ancestry,
  );
  protected readonly communityOptions = withCurrent(
    COMMUNITIES.map((c) => c.name),
    this.c.community,
  );

  protected get experiences(): FormArray<
    FormGroup<{ name: FormControl<string>; bonus: FormControl<number>; note: FormControl<string> }>
  > {
    return this.form.controls.experiences;
  }

  protected addExperience(): void {
    this.experiences.push(this.experienceGroup('', 2, ''));
  }

  /** Picking a class on a fresh sheet pre-fills its starting Evasion and HP. */
  protected onClassChange(): void {
    const info = findClass(this.form.controls.classId.value);
    // The old subclass belongs to another class now.
    if (!info?.subclasses.some((s) => s.name === this.form.controls.subclass.value)) {
      this.form.controls.subclass.setValue('');
    }
    if (!info || this.c.classId) return;
    this.form.patchValue({ evasion: info.evasion, hpMax: info.hp });
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

  private experienceGroup(name: string, bonus: number, note: string) {
    return this.fb.group({ name, bonus: this.num(bonus, -9, 9), note });
  }
}

interface GearChoice {
  choice: string;
  reskin: string;
  reskinOpen: boolean;
}

function initialWeapon(text: string): GearChoice {
  if (!text.trim()) return { choice: '', reskin: '', reskinOpen: false };
  const parsed = parseWeaponText(text);
  return parsed
    ? { choice: parsed.weapon.id, reskin: parsed.reskin, reskinOpen: !!parsed.reskin }
    : { choice: 'custom', reskin: '', reskinOpen: false };
}

function initialArmor(name: string): GearChoice {
  if (!name.trim()) return { choice: '', reskin: '', reskinOpen: false };
  const parsed = parseArmorName(name, ARMORS);
  return parsed
    ? { choice: parsed.armor.id, reskin: parsed.reskin, reskinOpen: !!parsed.reskin }
    : { choice: 'custom', reskin: '', reskinOpen: false };
}

function groupWeapons(list: readonly Weapon[]): { label: string; weapons: Weapon[] }[] {
  const wheel = (w: Weapon) => w.id.endsWith('wheelchair');
  return [
    { label: 'Armas físicas', weapons: list.filter((w) => w.damageType === 'phy' && !wheel(w)) },
    {
      label: 'Armas mágicas (exigem atributo de Conjuração)',
      weapons: list.filter((w) => w.damageType !== 'phy' && !wheel(w)),
    },
    { label: 'Cadeiras de rodas de combate', weapons: list.filter(wheel) },
  ];
}

function withCurrent(options: string[], current: string): string[] {
  return current && !options.includes(current) ? [current, ...options] : options;
}
