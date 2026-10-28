import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { CharacterSheet } from '../character-sheet/character-sheet';

/** Full character sheet in a popup, so the GM never leaves the panel. */
@Component({
  selector: 'app-sheet-dialog',
  imports: [CharacterSheet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-2xl border border-line bg-ink text-white shadow-2xl"
    >
      <app-character-sheet [characterId]="id" exitLabel="Fechar" (exit)="ref.close()" />
    </div>
  `,
})
export class SheetDialog {
  protected readonly id = inject<string>(DIALOG_DATA);
  protected readonly ref = inject(DialogRef);
}
