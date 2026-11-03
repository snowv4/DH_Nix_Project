import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  OnInit,
  signal,
  Signal,
} from '@angular/core';
import { SessionNoteRepository } from '../../core/firebase/session-note.repository';
import { INK_COLORS, PAGE_HEIGHT, SessionNote, Stroke } from '../../core/models/session-note';
import { decodeStrokes, encodeStrokes } from '../../core/rules/strokes';
import { HandwritingCanvas, InkMode } from './handwriting-canvas';

const SAVE_DELAY_MS = 1000;
const MAX_DOC_CHARS = 900_000;
const PEN_ONLY_KEY = 'dh-nix.pen-only';

/** Private per-session notebook: parchment pages with typed text and handwriting on top. */
@Component({
  selector: 'app-session-notebook',
  imports: [HandwritingCanvas],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './session-notebook.html',
  styleUrl: './session-notebook.css',
})
export class SessionNotebook implements OnInit {
  readonly characterId = input.required<string>();

  private readonly repo = inject(SessionNoteRepository);
  private readonly destroyRef = inject(DestroyRef);

  protected pages!: Signal<SessionNote[] | undefined>;
  protected readonly selectedId = signal('');
  /** Local working copy of the open page; Firestore echoes are ignored while it has unsaved edits. */
  protected readonly page = signal<SessionNote | null>(null);
  protected readonly strokes = signal<Stroke[]>([]);
  private readonly history = signal<Stroke[][]>([]);
  protected readonly mode = signal<InkMode>('off');
  protected readonly color = signal(0);
  protected readonly penWidth = signal(3);
  protected readonly penOnly = signal(readPenOnly());
  protected readonly saving = signal(false);
  protected readonly warning = signal('');
  protected readonly inks = INK_COLORS;
  protected readonly widths = [
    { value: 2, label: 'Fino' },
    { value: 3.5, label: 'Médio' },
    { value: 6, label: 'Grosso' },
  ];

  protected readonly canUndo = computed(() => this.history().length > 0);
  private dirty = false;
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    // Open the newest page by default, and pick up remote changes when there are no local edits.
    effect(() => {
      const list = this.pages?.();
      if (!list) return;
      const id = this.selectedId() || list[0]?.id || '';
      const remote = list.find((p) => p.id === id) ?? null;
      if (!this.selectedId() && id) this.selectedId.set(id);
      if (!this.dirty && remote && remote.updatedAt !== this.page()?.updatedAt) this.load(remote);
      if (!remote && this.page() && !this.dirty) this.page.set(null);
    });
    this.destroyRef.onDestroy(() => void this.flush());
  }

  ngOnInit(): void {
    this.pages = this.repo.watch(this.characterId(), this.destroyRef);
  }

  protected select(e: Event): void {
    void this.flush();
    const id = (e.target as HTMLSelectElement).value;
    this.selectedId.set(id);
    const remote = this.pages()?.find((p) => p.id === id);
    if (remote) this.load(remote);
  }

  protected async newPage(): Promise<void> {
    await this.flush();
    const list = this.pages() ?? [];
    const number = (list[0]?.number ?? 0) + 1;
    const page: SessionNote = {
      id: this.repo.newId(this.characterId()),
      number,
      date: new Date().toISOString().slice(0, 10),
      title: '',
      text: '',
      strokes: '',
      height: PAGE_HEIGHT,
      updatedAt: 0,
    };
    this.selectedId.set(page.id);
    this.load(page);
    this.dirty = true;
    await this.flush();
  }

  protected async deletePage(): Promise<void> {
    const p = this.page();
    if (!p || !window.confirm(`Apagar a página da Sessão ${p.number}? Isso não pode ser desfeito.`))
      return;
    clearTimeout(this.timer);
    this.dirty = false;
    this.page.set(null);
    this.selectedId.set('');
    await this.repo.remove(this.characterId(), p.id);
  }

  protected edit(patch: Partial<SessionNote>): void {
    this.page.update((p) => (p ? { ...p, ...patch } : p));
    this.schedule();
  }

  protected value(e: Event): string {
    return (e.target as HTMLInputElement | HTMLTextAreaElement).value;
  }

  protected onStrokes(next: Stroke[]): void {
    this.history.update((h) => [...h.slice(-49), this.strokes()]);
    this.strokes.set(next);
    this.schedule();
  }

  protected undo(): void {
    const h = this.history();
    if (!h.length) return;
    this.strokes.set(h[h.length - 1]);
    this.history.set(h.slice(0, -1));
    this.schedule();
  }

  protected morePaper(): void {
    this.edit({ height: (this.page()?.height ?? PAGE_HEIGHT) + 700 });
  }

  protected togglePenOnly(): void {
    this.penOnly.update((v) => !v);
    try {
      localStorage.setItem(PEN_ONLY_KEY, String(this.penOnly()));
    } catch {
      // ignore
    }
  }

  protected label(p: SessionNote): string {
    const [y, m, d] = p.date.split('-');
    return `Sessão ${p.number} · ${d}/${m}/${y}${p.title ? ' — ' + p.title : ''}`;
  }

  private load(p: SessionNote): void {
    this.page.set(p);
    this.strokes.set(decodeStrokes(p.strokes));
    this.history.set([]);
  }

  private schedule(): void {
    this.dirty = true;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.flush(), SAVE_DELAY_MS);
  }

  private async flush(): Promise<void> {
    clearTimeout(this.timer);
    const p = this.page();
    if (!this.dirty || !p) return;
    const strokes = encodeStrokes(this.strokes());
    if (strokes.length + p.text.length > MAX_DOC_CHARS) {
      this.warning.set(
        'Esta página está quase cheia. Crie uma página nova para continuar desenhando.',
      );
      return;
    }
    this.warning.set('');
    this.dirty = false;
    this.saving.set(true);
    try {
      const saved = { ...p, strokes, updatedAt: Date.now() };
      this.page.set(saved);
      await this.repo.save(this.characterId(), saved);
    } catch (e: unknown) {
      console.error(e);
      this.dirty = true;
      this.warning.set('Não consegui salvar. Vou tentar de novo na próxima alteração.');
    } finally {
      this.saving.set(false);
    }
  }
}

function readPenOnly(): boolean {
  try {
    return localStorage.getItem(PEN_ONLY_KEY) === 'true';
  } catch {
    return false;
  }
}
