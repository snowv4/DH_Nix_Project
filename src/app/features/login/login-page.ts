import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LicenseNotice } from '../../shared/ui/license-notice';
import { isGmPin } from '../../core/auth/pin';
import { SessionService } from '../../core/auth/session.service';
import { CharacterRepository } from '../../core/firebase/character.repository';
import { DraftRepository } from '../../core/firebase/draft.repository';
import { FirebaseService } from '../../core/firebase/firebase.service';
import { characterIdFromName, createBlankCharacter } from '../../core/rules/character';

type Step = 'name' | 'pin' | 'new';

const GM_KEYWORD = 'mestre';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, LicenseNotice],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login-page.html',
  styleUrl: './login-page.css',
})
export class LoginPage {
  private readonly firebase = inject(FirebaseService);
  private readonly characters = inject(CharacterRepository);
  private readonly drafts = inject(DraftRepository);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  protected readonly step = signal<Step>('name');
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  /** A creation draft already exists for the typed name. */
  protected readonly hasDraft = signal(false);

  protected readonly name = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  protected readonly pin = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  // Forms need a FormGroup so (ngSubmit) intercepts the native submit instead of reloading the page.
  protected readonly nameForm = new FormGroup({ name: this.name });
  protected readonly pinForm = new FormGroup({ pin: this.pin });

  protected async submitName(): Promise<void> {
    const typed = this.name.value.trim();
    if (!typed) return;
    if (characterIdFromName(typed) === GM_KEYWORD) {
      this.step.set('pin');
      return;
    }
    if (!characterIdFromName(typed)) {
      this.error.set('Use letras ou números no nome.');
      return;
    }
    await this.run(async () => {
      const id = characterIdFromName(typed);
      if (await this.characters.exists(id)) {
        this.enterSheet(id);
      } else {
        this.hasDraft.set(await this.drafts.exists(id));
        this.step.set('new');
      }
    });
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

  protected async createBlank(): Promise<void> {
    await this.run(async () => {
      const character = createBlankCharacter(this.name.value);
      await this.characters.create(character);
      this.enterSheet(character.id);
    });
  }

  protected startGuide(): void {
    const name = this.name.value.trim();
    const id = characterIdFromName(name);
    this.session.start({ kind: 'player', characterId: id });
    void this.router.navigate(['/criar', id], { queryParams: { nome: name } });
  }

  protected back(): void {
    this.error.set('');
    this.pin.reset();
    this.step.set('name');
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
