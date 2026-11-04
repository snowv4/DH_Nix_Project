import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { MAX_SUPPORTED_LEVEL } from '../../core/rules/leveling';
import { Dialog } from '@angular/cdk/dialog';
import { Router, RouterLink } from '@angular/router';
import { SessionService } from '../../core/auth/session.service';
import { findClass } from '../../core/data/srd';
import { TRAIT_LABELS } from '../../core/data/traits';
import { CampaignRepository, MAX_FEAR } from '../../core/firebase/campaign.repository';
import { CharacterRepository } from '../../core/firebase/character.repository';
import { DraftRepository } from '../../core/firebase/draft.repository';
import { MapRepository } from '../../core/firebase/map.repository';
import { NpcRepository } from '../../core/firebase/npc.repository';
import { createNpc, Npc } from '../../core/models/npc';
import { toggleSlot } from '../../core/rules/character';
import { freeSpawnPoint } from '../../core/rules/map';
import { randomName } from '../../core/rules/names';
import { NpcCard } from '../npcs/npc-card';
import { NpcDialog } from '../npcs/npc-dialog';
import { BestiaryDialog } from '../npcs/bestiary-dialog';
import { Character, TRAIT_IDS } from '../../core/models/character';
import { SheetDialog } from './sheet-dialog';

type View = 'compact' | 'extended';

const VIEW_KEY = 'dh-nix.gm-view';

import { ConditionView, conditionViews } from '../../core/rules/conditions';

@Component({
  selector: 'app-gm-panel',
  imports: [RouterLink, NpcCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './gm-panel.html',
})
export class GmPanel {
  private readonly destroyRef = inject(DestroyRef);
  private readonly campaignRepo = inject(CampaignRepository);
  private readonly dialog = inject(Dialog);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  private readonly characterRepo = inject(CharacterRepository);
  private readonly drafts = inject(DraftRepository);
  protected readonly characters = this.characterRepo.watchAll(this.destroyRef);
  protected readonly campaign = this.campaignRepo.watchCampaign(this.destroyRef);
  protected readonly view = signal<View>(readView());
  protected readonly fearSlots = Array.from({ length: MAX_FEAR }, (_, i) => i);
  protected readonly maxFear = MAX_FEAR;
  protected readonly traitIds = TRAIT_IDS;
  protected readonly traitLabels = TRAIT_LABELS;

  protected setView(v: View): void {
    this.view.set(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      // ignore
    }
  }

  protected readonly maxSupportedLevel = MAX_SUPPORTED_LEVEL;

  // ---------- NPCs ----------
  private readonly npcRepo = inject(NpcRepository);
  private readonly maps = inject(MapRepository);
  protected readonly tab = signal<'players' | 'npcs'>('players');
  protected readonly npcs = this.npcRepo.watchAll(this.destroyRef);
  protected readonly npcQuery = signal('');
  protected readonly npcMessage = signal('');
  protected readonly filteredNpcs = computed(() => {
    const q = normalize(this.npcQuery());
    return this.npcs().filter((n) => !q || normalize(`${n.name} ${n.tags}`).includes(q));
  });

  protected newNpc(): void {
    this.openNpc(createNpc(this.npcRepo.newId(), randomName('human'), 0));
  }

  protected editNpc(n: Npc): void {
    this.openNpc(n);
  }

  protected duplicateNpc(n: Npc): void {
    void this.npcRepo.save({
      ...n,
      id: this.npcRepo.newId(),
      name: `${n.name} (cópia)`,
      hp: { ...n.hp, marked: 0 },
      stress: { ...n.stress, marked: 0 },
    });
  }

  protected removeNpc(n: Npc): void {
    if (window.confirm(`Excluir ${n.name}? Isso não pode ser desfeito.`))
      void this.npcRepo.remove(n.id);
  }

  protected tapNpc(n: Npc, track: 'hp' | 'stress', index: number): void {
    void this.npcRepo.update(n.id, { [track]: toggleSlot(n[track], index) });
  }

  /** Adds the NPC as a (hidden) token on the battle map, using its portrait. */
  protected async npcToMap(n: Npc): Promise<void> {
    const active = await this.maps.readActive();
    if (!active) {
      this.npcMessage.set('Crie um mapa no Mapa de combate primeiro.');
      return;
    }
    await this.maps.upsertToken(active.id, {
      id: `npc-${n.id}-${Date.now().toString(36)}`,
      kind: 'monster',
      refId: n.id,
      label: n.name,
      icon: n.icon ?? '',
      color: '#8b5cf6',
      ...freeSpawnPoint(active.state),
      size: 1,
      hidden: true,
    });
    this.npcMessage.set(`${n.name} entrou no mapa “${active.state.name}” (oculto da TV).`);
  }

  protected openBestiary(): void {
    this.dialog.open(BestiaryDialog, {
      width: '44rem',
      maxWidth: 'calc(100vw - 1.5rem)',
      maxHeight: 'calc(100dvh - 1.5rem)',
    });
  }

  private openNpc(n: Npc): void {
    this.dialog.open(NpcDialog, {
      data: n,
      width: '44rem',
      maxWidth: 'calc(100vw - 1.5rem)',
      maxHeight: 'calc(100dvh - 1.5rem)',
    });
  }

  protected value(e: Event): string {
    return (e.target as HTMLInputElement).value;
  }
  protected readonly levelUnlocked = computed(() => this.campaign().levelUnlocked ?? 1);

  protected releaseLevel(level: number): void {
    void this.campaignRepo.setLevelUnlocked(level);
  }

  protected fear(delta: number): void {
    void this.campaignRepo.adjustFear(delta);
  }

  protected setFear(index: number): void {
    const current = this.campaign().fear;
    void this.campaignRepo.adjustFear(index + 1 === current ? -1 : index + 1 - current);
  }

  protected readonly deleting = signal('');

  /** GM-only: deletes the sheet and any leftover creation draft, after a confirmation. */
  protected async remove(c: Character): Promise<void> {
    if (!window.confirm(`Excluir a ficha de ${c.name}? Isso não pode ser desfeito.`)) return;
    this.deleting.set(c.id);
    try {
      await Promise.all([this.characterRepo.remove(c.id), this.drafts.remove(c.id)]);
    } catch (e: unknown) {
      console.error(e);
      window.alert('Não consegui excluir. Confira a internet e tente de novo.');
    } finally {
      this.deleting.set('');
    }
  }

  protected open(c: Character): void {
    this.dialog.open(SheetDialog, {
      data: c.id,
      width: '72rem',
      maxWidth: 'calc(100vw - 1.5rem)',
    });
  }

  protected conds(tags: Character['conditions']): ConditionView[] {
    return conditionViews(tags);
  }

  protected className(c: Character): string {
    return findClass(c.classId)?.name ?? '';
  }

  protected signed(n: number): string {
    return n > 0 ? `+${n}` : `${n}`;
  }

  protected logout(): void {
    this.session.end();
    void this.router.navigateByUrl('/');
  }
}

function readView(): View {
  try {
    return localStorage.getItem(VIEW_KEY) === 'extended' ? 'extended' : 'compact';
  } catch {
    return 'compact';
  }
}

function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
