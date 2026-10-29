import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { Router } from '@angular/router';
import { SessionService } from '../../core/auth/session.service';
import { findClass } from '../../core/data/srd';
import { TRAIT_LABELS } from '../../core/data/traits';
import { CampaignRepository, MAX_FEAR } from '../../core/firebase/campaign.repository';
import { CharacterRepository } from '../../core/firebase/character.repository';
import { DraftRepository } from '../../core/firebase/draft.repository';
import { Character, TRAIT_IDS } from '../../core/models/character';
import { SheetDialog } from './sheet-dialog';

type View = 'compact' | 'extended';

const VIEW_KEY = 'dh-nix.gm-view';

@Component({
  selector: 'app-gm-panel',
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
