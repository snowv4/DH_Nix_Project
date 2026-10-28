import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { COMMUNITIES } from '../../../core/data/srd';
import { CreationStore } from '../creation.store';

@Component({
  selector: 'app-community-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="text-muted">
      A comunidade é a cultura ou o ambiente que mais influenciou sua criação. Os adjetivos servem
      de inspiração para a personalidade.
    </p>
    <div class="mt-4 flex flex-col gap-3">
      @for (c of communities; track c.id) {
        @let chosen = store.draft().communityId === c.id;
        <button
          type="button"
          class="card flex flex-col gap-2 text-left"
          [class.!border-hope]="chosen"
          [attr.aria-pressed]="chosen"
          (click)="store.update({ communityId: c.id })"
        >
          <h3 class="font-display text-lg font-bold">
            {{ c.name }} <span class="text-sm font-normal text-muted">({{ c.nameEn }})</span>
          </h3>
          <p class="text-sm text-muted">{{ c.summary }}</p>
          <p class="text-xs italic text-muted">{{ c.adjectives.join(', ') }}</p>
          <p class="text-sm">
            <strong class="text-hope">{{ c.feature.name }}:</strong> {{ c.feature.text }}
          </p>
        </button>
      }
    </div>
  `,
})
export class CommunityStep {
  protected readonly store = inject(CreationStore);
  protected readonly communities = COMMUNITIES;
}
