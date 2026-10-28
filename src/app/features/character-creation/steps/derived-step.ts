import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { selectedClass } from '../../../core/rules/creation';
import { CreationStore } from '../creation.store';

@Component({
  selector: 'app-derived-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="text-muted">Estes números são calculados para você. Veja de onde vem cada um.</p>
    <div class="mt-4 grid grid-cols-2 gap-3">
      <div class="card">
        <p class="label">Evasão</p>
        <p class="font-display text-4xl">{{ stats().evasion }}</p>
        <p class="text-xs text-muted">
          Base da classe: {{ cls()?.evasion }}. A chance de inimigos errarem ataques em você.
        </p>
      </div>
      <div class="card">
        <p class="label">Pontos de Vida</p>
        <p class="font-display text-4xl text-hp">{{ stats().hp }}</p>
        <p class="text-xs text-muted">
          Base da classe: {{ cls()?.hp }}. Quando todos forem marcados, você enfrenta a morte.
        </p>
      </div>
      <div class="card">
        <p class="label">Estresse</p>
        <p class="font-display text-4xl text-stress">{{ stats().stress }}</p>
        <p class="text-xs text-muted">
          Todo personagem começa com 6. Tensão mental e esforço físico.
        </p>
      </div>
      <div class="card">
        <p class="label">Esperança</p>
        <p class="font-display text-4xl text-hope">{{ stats().hope }}</p>
        <p class="text-xs text-muted">
          Começa com 2 (máx. 6). Moeda para Experiências e habilidades.
        </p>
      </div>
      <div class="card">
        <p class="label">Proficiência</p>
        <p class="font-display text-4xl">{{ stats().proficiency }}</p>
        <p class="text-xs text-muted">Quantos dados de dano da arma você rola.</p>
      </div>
      <div class="card">
        <p class="label">Nível</p>
        <p class="font-display text-4xl">{{ stats().level }}</p>
        <p class="text-xs text-muted">Todo personagem começa no nível 1 (Patamar 1).</p>
      </div>
    </div>
    @if (stats().notes.length) {
      <div class="card mt-3 text-sm">
        <p class="label">Bônus aplicados</p>
        <ul class="mt-1 list-inside list-disc">
          @for (n of stats().notes; track n) {
            <li>{{ n }}</li>
          }
        </ul>
      </div>
    }
    <p class="mt-3 text-sm text-muted">
      Armadura e limiares de dano dependem do equipamento — você escolhe no próximo passo.
    </p>
  `,
})
export class DerivedStep {
  protected readonly store = inject(CreationStore);
  protected readonly stats = this.store.stats;
  protected readonly cls = computed(() => selectedClass(this.store.draft()));
}
