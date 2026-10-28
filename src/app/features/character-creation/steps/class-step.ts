import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CLASSES, ClassData, DOMAINS } from '../../../core/data/srd';
import { CreationStore } from '../creation.store';

@Component({
  selector: 'app-class-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="text-muted">
      A classe define seu papel no grupo, seus domínios de cartas, Evasão e PV iniciais. Toque para
      ver os detalhes.
    </p>
    <div class="mt-4 flex flex-col gap-3">
      @for (c of classes; track c.id) {
        @let selected = store.draft().classId === c.id;
        <article class="card !p-0 overflow-hidden" [class.!border-hope]="selected">
          <button
            type="button"
            class="flex w-full items-center gap-3 p-4 text-left"
            (click)="toggle(c.id)"
            [attr.aria-expanded]="open() === c.id"
          >
            <div class="min-w-0 flex-1">
              <h3 class="font-display text-lg font-bold">
                {{ c.name }} <span class="text-sm font-normal text-muted">({{ c.nameEn }})</span>
              </h3>
              <p class="text-sm text-muted">
                {{ domainNames(c) }} · Evasão {{ c.evasion }} · PV {{ c.hp }}
              </p>
            </div>
            @if (selected) {
              <span class="rounded-full bg-hope px-2 py-0.5 text-xs font-bold text-ink"
                >Escolhida</span
              >
            }
            <span class="text-muted" aria-hidden="true">{{ open() === c.id ? '▲' : '▼' }}</span>
          </button>
          @if (open() === c.id) {
            <div class="flex flex-col gap-3 border-t border-line p-4 text-sm">
              <p>{{ c.description }}</p>
              <div>
                <p class="label">Característica de Esperança</p>
                <p>
                  <strong class="text-hope">{{ c.hopeFeature.name }}:</strong>
                  {{ c.hopeFeature.text }}
                </p>
              </div>
              <div>
                <p class="label">Características da classe</p>
                @for (f of c.features; track f.nameEn) {
                  <p class="mt-1 whitespace-pre-line">
                    <strong>{{ f.name }}:</strong> {{ f.text }}
                  </p>
                }
              </div>
              <p class="text-muted">
                Subclasses: {{ c.subclasses[0].name }} ou {{ c.subclasses[1].name }}
              </p>
              <button type="button" class="btn-hope" (click)="choose(c.id)">
                {{ selected ? 'Classe escolhida ✓' : 'Escolher ' + c.name }}
              </button>
            </div>
          }
        </article>
      }
    </div>
  `,
})
export class ClassStep {
  protected readonly store = inject(CreationStore);
  protected readonly classes = CLASSES;
  protected readonly open = signal(this.store.draft().classId);

  protected domainNames(c: ClassData): string {
    return c.domains.map((d) => DOMAINS[d].name).join(' & ');
  }

  protected toggle(id: string): void {
    this.open.update((o) => (o === id ? '' : id));
  }

  protected choose(id: string): void {
    const d = this.store.draft();
    if (d.classId === id) return;
    // Changing class invalidates choices that depend on it.
    this.store.update({
      classId: id,
      subclassId: '',
      domainCardIds: [],
      classItem: '',
      backgroundAnswers: [],
      connectionAnswers: [],
      primaryWeaponId: '',
      secondaryWeaponId: '',
    });
  }
}
