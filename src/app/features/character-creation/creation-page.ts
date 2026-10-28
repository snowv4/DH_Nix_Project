import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LicenseNotice } from '../../shared/ui/license-notice';
import { CREATION_STEPS } from '../../core/rules/creation';
import { CreationStore } from './creation.store';
import { AncestryStep } from './steps/ancestry-step';
import { CardsStep } from './steps/cards-step';
import { ClassStep } from './steps/class-step';
import { CommunityStep } from './steps/community-step';
import { ConnectionsStep } from './steps/connections-step';
import { DerivedStep } from './steps/derived-step';
import { EquipmentStep } from './steps/equipment-step';
import { ExperiencesStep } from './steps/experiences-step';
import { ReviewStep } from './steps/review-step';
import { StoryStep } from './steps/story-step';
import { SubclassStep } from './steps/subclass-step';
import { TraitsStep } from './steps/traits-step';

/** `/criar/:id` — guided character creation, one step per screen (spec 4.2). */
@Component({
  selector: 'app-creation-page',
  imports: [
    ClassStep,
    SubclassStep,
    AncestryStep,
    CommunityStep,
    TraitsStep,
    DerivedStep,
    EquipmentStep,
    ExperiencesStep,
    CardsStep,
    StoryStep,
    ConnectionsStep,
    ReviewStep,
    LicenseNotice,
  ],
  // Store scoped to this page: a fresh wizard state per visit, saved on leave.
  providers: [CreationStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './creation-page.html',
})
export class CreationPage implements OnInit {
  readonly id = input.required<string>();
  /** Display name typed at login, passed as `?nome=`. */
  readonly nome = input('');

  protected readonly store = inject(CreationStore);
  private readonly router = inject(Router);
  protected readonly steps = CREATION_STEPS;
  protected readonly finishing = signal(false);
  protected readonly error = signal('');

  ngOnInit(): void {
    void this.store.load(this.id(), this.nome() || this.id());
  }

  protected next(): void {
    this.store.next();
    window.scrollTo({ top: 0 });
  }

  protected back(): void {
    this.store.back();
    window.scrollTo({ top: 0 });
  }

  protected async finish(): Promise<void> {
    if (this.store.error()) return;
    this.finishing.set(true);
    this.error.set('');
    try {
      const id = await this.store.finish();
      await this.router.navigate(['/ficha', id]);
    } catch (e: unknown) {
      console.error(e);
      this.error.set('Não consegui salvar a ficha. Confira a internet e tente de novo.');
    } finally {
      this.finishing.set(false);
    }
  }

  protected exit(): void {
    void this.router.navigateByUrl('/');
  }
}
