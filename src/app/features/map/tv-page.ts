import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  Injector,
  inject,
} from '@angular/core';
import { CharacterRepository } from '../../core/firebase/character.repository';
import { MapRepository } from '../../core/firebase/map.repository';
import { MapCanvas } from './map-canvas';

/** `/tv` — what the players see on the TV: no menus, opaque fog, no hidden tokens (spec 4.8). */
@Component({
  selector: 'app-tv-page',
  imports: [MapCanvas],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative h-dvh w-full cursor-none bg-black">
      <app-map-canvas viewer="tv" [state]="state()" [image]="image()" [portraits]="portraits()" />
      @if (!state().imageId) {
        <p class="absolute inset-0 grid place-items-center font-display text-2xl text-muted">
          Aguardando o mestre…
        </p>
      }
    </div>
  `,
})
export class TvPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly maps = inject(MapRepository);
  protected readonly state = this.maps.watchState(this.destroyRef);
  private readonly characters = inject(CharacterRepository).watchAll(this.destroyRef);
  protected readonly image = this.maps.watchCurrentImage(this.state, inject(Injector));
  protected readonly portraits = computed(() =>
    Object.fromEntries(this.characters().map((c) => [c.id, c.portraitUrl])),
  );
}
