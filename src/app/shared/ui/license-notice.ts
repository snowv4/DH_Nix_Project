import { ChangeDetectionStrategy, Component } from '@angular/core';

/** DPCGL 2.0 §4.1 attribution, shown wherever SRD content is displayed. */
@Component({
  selector: 'app-license-notice',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="text-center text-[11px] leading-snug text-muted/80">
      Inclui materiais do Daggerheart System Reference Document 2.0, © Critical Role, LLC, sob a
      <a
        class="underline"
        href="https://darringtonpress.com/license/"
        target="_blank"
        rel="noopener"
        >DPCGL</a
      >. Conteúdo traduzido e adaptado para pt-BR. Mais em
      <a class="underline" href="https://www.daggerheart.com" target="_blank" rel="noopener"
        >daggerheart.com</a
      >. Projeto de fãs, sem afiliação com a Darrington Press.
    </p>
  `,
})
export class LicenseNotice {}
