import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { isGmPin } from '../../core/auth/pin';
import { SessionService } from '../../core/auth/session.service';
import { CharacterRepository } from '../../core/firebase/character.repository';
import { DraftRepository } from '../../core/firebase/draft.repository';
import { FirebaseService } from '../../core/firebase/firebase.service';
import { characterIdFromName, createBlankCharacter } from '../../core/rules/character';
import { LicenseNotice } from '../../shared/ui/license-notice';

type Step = 'pick' | 'pin' | 'create';

/** Dropdown values: `char:<id>`, `draft:<id>` or `gm`. */
const GM_OPTION = 'gm';

interface Entry {
  id: string;
  name: string;
}

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, LicenseNotice],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login-page.html',
  styleUrl: './login-page.css',
})
export class LoginPage implements OnInit {
  private readonly firebase = inject(FirebaseService);
  private readonly characters = inject(CharacterRepository);
  private readonly drafts = inject(DraftRepository);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  protected readonly step = signal<Step>('pick');
  protected readonly busy = signal(false);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly characterList = signal<Entry[]>([]);
  protected readonly draftList = signal<Entry[]>([]);
  protected readonly gmOption = GM_OPTION;

  protected readonly pick = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  protected readonly name = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  protected readonly pin = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  // Forms need a FormGroup so (ngSubmit) intercepts the native submit instead of reloading the page.
  protected readonly pickForm = new FormGroup({ pick: this.pick });
  protected readonly createForm = new FormGroup({ name: this.name });
  protected readonly pinForm = new FormGroup({ pin: this.pin });

  ngOnInit(): void {
    void this.loadList();
  }

  protected async submitPick(): Promise<void> {
    const value = this.pick.value;
    if (value === GM_OPTION) {
      this.step.set('pin');
      return;
    }
    const [kind, id] = value.split(':');
    if (kind === 'char') this.enterSheet(id);
    if (kind === 'draft') {
      const draft = this.draftList().find((d) => d.id === id);
      this.openGuide(id, draft?.name ?? id);
    }
  }

  protected async submitPin(): Promise<void> {
    await this.run(async () => {
      if (!(await isGmPin(this.pin.value))) {
        this.error.set('PIN incorreto.');
        this.pin.reset();
        return;
      }
      this.session.start({ kind: 'gm' });
      await this.router.navigateByUrl('/mestre');
    });
  }

  /** Validates the new name; returns its id or null (with an error shown). */
  private newId(): string | null {
    const id = characterIdFromName(this.name.value);
    if (!id) {
      this.error.set('Use letras ou números no nome.');
      return null;
    }
    if (id === 'mestre') {
      this.error.set('Esse nome é reservado.');
      return null;
    }
    if (this.characterList().some((c) => c.id === id)) {
      this.error.set('Já existe um personagem com esse nome. Escolha na lista.');
      return null;
    }
    this.error.set('');
    return id;
  }

  protected startGuide(): void {
    const id = this.newId();
    if (id) this.openGuide(id, this.name.value.trim());
  }

  protected async createBlank(): Promise<void> {
    if (!this.newId()) return;
    await this.run(async () => {
      const character = createBlankCharacter(this.name.value);
      await this.characters.create(character);
      this.enterSheet(character.id);
    });
  }

  protected goTo(step: Step): void {
    this.error.set('');
    this.pin.reset();
    this.step.set(step);
  }

  private async loadList(): Promise<void> {
    this.loading.set(true);
    await this.run(async () => {
      const [chars, drafts] = await Promise.all([
        this.characters.listNames(),
        this.drafts.listNames(),
      ]);
      this.characterList.set(chars);
      // A finished character supersedes a leftover draft with the same id.
      this.draftList.set(drafts.filter((d) => !chars.some((c) => c.id === d.id)));
    });
    this.loading.set(false);
  }

  private openGuide(id: string, name: string): void {
    this.session.start({ kind: 'player', characterId: id });
    void this.router.navigate(['/criar', id], { queryParams: { nome: name } });
  }

  private enterSheet(id: string): void {
    this.session.start({ kind: 'player', characterId: id });
    void this.router.navigate(['/ficha', id]);
  }

  private async run(task: () => Promise<void>): Promise<void> {
    this.busy.set(true);
    this.error.set('');
    try {
      await this.firebase.ensureSignedIn();
      await task();
    } catch (e: unknown) {
      console.error(e);
      this.error.set('Não consegui falar com o servidor. Confira a internet e tente de novo.');
    } finally {
      this.busy.set(false);
    }
  }
}
