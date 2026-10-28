import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { Router } from '@angular/router';
import { SessionService } from '../../core/auth/session.service';
import { findClass, TRAIT_LABELS } from '../../core/data/classes';
import { CampaignRepository, MAX_FEAR } from '../../core/firebase/campaign.repository';
import { CharacterRepository } from '../../core/firebase/character.repository';
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

  protected readonly characters = inject(CharacterRepository).watchAll(this.destroyRef);
  protected readonly campaign = this.campaignRepo.watchCampaign(this.destroyRef);
  protected readonly rolls = this.campaignRepo.watchRecentRolls(this.destroyRef);
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

  protected time(ms: number): string {
    return new Date(ms).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
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
