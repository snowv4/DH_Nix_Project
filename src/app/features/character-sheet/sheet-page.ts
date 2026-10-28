import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { SessionService } from '../../core/auth/session.service';
import { CharacterSheet } from './character-sheet';

/** Route wrapper: `/ficha/:id`. The `id` input comes from the URL (withComponentInputBinding). */
@Component({
  selector: 'app-sheet-page',
  imports: [CharacterSheet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-character-sheet
    [characterId]="id()"
    [exitLabel]="isGm ? 'Painel' : 'Sair'"
    (exit)="leave()"
  />`,
})
export class SheetPage {
  readonly id = input.required<string>();
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);
  protected readonly isGm = this.session.session()?.kind === 'gm';

  protected leave(): void {
    if (this.isGm) {
      void this.router.navigateByUrl('/mestre');
      return;
    }
    this.session.end();
    void this.router.navigateByUrl('/');
  }
}
