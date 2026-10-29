import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type Line =
  | { kind: 'named'; name: string; text: string }
  | { kind: 'bullet'; name: string; text: string }
  | { kind: 'plain'; text: string };

/** "Power Push: does X" → a highlighted name followed by its effect. Short label, no sentence inside. */
const NAMED = /^([^:.!?•]{2,40}):\s+(.+)$/;
const BULLET = /^[•◦-]\s+(.+)$/;

const capitalize = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

export function parseLine(raw: string): Line {
  const bullet = BULLET.exec(raw);
  if (bullet) {
    const named = NAMED.exec(bullet[1]);
    return named
      ? { kind: 'bullet', name: named[1], text: named[2] }
      : { kind: 'bullet', name: '', text: bullet[1] };
  }
  const named = NAMED.exec(raw);
  return named
    ? { kind: 'named', name: named[1], text: capitalize(named[2]) }
    : { kind: 'plain', text: raw };
}

/**
 * Renders SRD-style text: each "Name: effect" line gets a highlighted name (great for grimoires
 * with three spells), "•" lines become a list. Plain text stays as is.
 */
@Component({
  selector: 'app-rich-text',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-2 text-sm leading-relaxed">
      @for (line of lines(); track $index) {
        @switch (line.kind) {
          @case ('named') {
            <p class="border-l-2 border-hope/60 pl-2.5">
              <span class="block text-[0.72rem] font-bold tracking-wider text-hope uppercase">{{
                line.name
              }}</span>
              <span>{{ line.text }}</span>
            </p>
          }
          @case ('bullet') {
            <p class="flex gap-2 pl-1">
              <span class="text-hope" aria-hidden="true">◆</span>
              <span>
                @if (line.name) {
                  <strong class="font-semibold text-white">{{ line.name }}:</strong>&ngsp;
                }
                {{ line.text }}
              </span>
            </p>
          }
          @default {
            <p>{{ line.text }}</p>
          }
        }
      }
    </div>
  `,
})
export class RichText {
  readonly text = input('');
  protected readonly lines = computed(() =>
    this.text()
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map(parseLine),
  );
}
