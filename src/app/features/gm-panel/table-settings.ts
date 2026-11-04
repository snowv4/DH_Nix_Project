import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SessionService } from '../../core/auth/session.service';
import { DEFAULT_TABLE_ID, TableService } from '../../core/auth/table.service';
import { CampaignRepository } from '../../core/firebase/campaign.repository';

const PIN = /^\d{4,8}$/;

/** GM-only table settings: rename, change the GM PIN, delete the table. */
@Component({
  selector: 'app-table-settings',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="card flex flex-col gap-5" aria-labelledby="table-settings-title">
      <div class="flex items-center justify-between gap-2">
        <h2 id="table-settings-title" class="font-display text-lg text-hope">⚙ Configurar mesa</h2>
        <button type="button" class="btn min-h-11 px-3 text-sm" (click)="closed.emit()">
          Fechar
        </button>
      </div>

      <form class="flex flex-col gap-2" [formGroup]="nameForm" (ngSubmit)="rename()">
        <label for="table-rename" class="label">Nome da mesa</label>
        <div class="flex gap-2">
          <input
            id="table-rename"
            class="field min-w-0 flex-1"
            formControlName="name"
            maxlength="40"
          />
          <button
            type="submit"
            class="btn-hope shrink-0 px-4"
            [disabled]="busy() || nameForm.invalid"
          >
            Salvar
          </button>
        </div>
      </form>

      <form class="flex flex-col gap-2" [formGroup]="pinForm" (ngSubmit)="changePin()">
        <span class="label">Novo PIN do mestre</span>
        <div class="grid grid-cols-2 gap-2">
          <input
            class="field text-center text-xl tracking-[0.4em]"
            type="password"
            inputmode="numeric"
            autocomplete="new-password"
            maxlength="8"
            formControlName="pin"
            aria-label="Novo PIN"
            placeholder="PIN"
          />
          <input
            class="field text-center text-xl tracking-[0.4em]"
            type="password"
            inputmode="numeric"
            autocomplete="new-password"
            maxlength="8"
            formControlName="confirm"
            aria-label="Repita o novo PIN"
            placeholder="Repita"
          />
        </div>
        <p class="text-xs text-muted">De 4 a 8 números. Vale na próxima vez que o mestre entrar.</p>
        <button type="submit" class="btn" [disabled]="busy() || pinForm.invalid">Trocar PIN</button>
      </form>

      <div class="flex flex-col gap-2 rounded-xl border border-hp/40 bg-hp/5 p-3">
        <span class="label text-hp">Excluir mesa</span>
        @if (isDefault()) {
          <p class="text-sm text-muted">
            A Mesa Nix é a mesa principal e não pode ser excluída pelo site.
          </p>
        } @else {
          <p class="text-sm text-muted">
            Apaga para sempre os personagens, anotações, NPCs, mapas e o Medo desta mesa. Não tem
            como desfazer. Para confirmar, digite o nome da mesa:
            <strong class="text-white">{{ name() }}</strong>
          </p>
          <input
            class="field"
            aria-label="Digite o nome da mesa para confirmar"
            autocomplete="off"
            [value]="confirmName()"
            (input)="confirmName.set(inputText($event))"
          />
          <button
            type="button"
            class="btn min-h-11 border-hp text-hp"
            [disabled]="busy() || confirmName().trim() !== name().trim()"
            (click)="remove()"
          >
            {{ busy() ? 'Excluindo…' : 'Excluir esta mesa' }}
          </button>
        }
      </div>

      @if (message()) {
        <p class="rounded-lg bg-hope/15 px-3 py-2 text-sm text-hope" role="status">
          {{ message() }}
        </p>
      }
      @if (error()) {
        <p class="rounded-lg bg-hp/15 px-3 py-2 text-sm text-hp" role="alert">{{ error() }}</p>
      }
    </section>
  `,
})
export class TableSettings implements OnInit {
  /** Current table name (live). */
  readonly name = input.required<string>();
  readonly closed = output();

  private readonly campaigns = inject(CampaignRepository);
  private readonly table = inject(TableService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  protected readonly busy = signal(false);
  protected readonly message = signal('');
  protected readonly error = signal('');
  protected readonly confirmName = signal('');
  protected readonly isDefault = computed(() => this.table.id() === DEFAULT_TABLE_ID);

  protected readonly nameForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
  protected readonly pinForm = new FormGroup({
    pin: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(PIN), Validators.required],
    }),
    confirm: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  ngOnInit(): void {
    this.nameForm.setValue({ name: this.name() });
  }

  protected rename(): Promise<void> {
    return this.run(async () => {
      await this.campaigns.renameTable(this.nameForm.getRawValue().name);
      this.message.set('Nome salvo.');
    });
  }

  protected changePin(): Promise<void> {
    const { pin, confirm } = this.pinForm.getRawValue();
    if (pin !== confirm) {
      this.error.set('Os dois PINs não batem.');
      return Promise.resolve();
    }
    return this.run(async () => {
      await this.campaigns.setGmPin(pin);
      this.pinForm.reset();
      this.message.set('PIN do mestre trocado.');
    });
  }

  protected remove(): Promise<void> {
    return this.run(async () => {
      await this.campaigns.deleteTable();
      this.table.select(DEFAULT_TABLE_ID);
      this.session.end();
      await this.router.navigateByUrl('/');
    });
  }

  private async run(task: () => Promise<void>): Promise<void> {
    this.busy.set(true);
    this.message.set('');
    this.error.set('');
    try {
      await task();
    } catch (e: unknown) {
      console.error(e);
      this.error.set('Não deu certo. Confira a internet e tente de novo.');
    } finally {
      this.busy.set(false);
    }
  }

  protected inputText(e: Event): string {
    return (e.target as HTMLInputElement).value;
  }
}
