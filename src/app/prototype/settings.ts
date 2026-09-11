import { Component, signal } from '@angular/core';

@Component({
  selector: 'ccdr-proto-settings',
  template: `
    <section class="proto-panel max-w-xl">
      <h2 class="font-serif text-xl">Upload commit policy</h2>
      <p class="mt-1 mb-5 text-[13px] text-[color:var(--proto-muted)]">
        Staged workbooks never write until someone commits. Choose whether a bad row blocks the
        rest of the file.
      </p>
      <div class="grid gap-3">
        <button
          type="button"
          class="proto-choice"
          [class.proto-choice-on]="policy() === 'valid'"
          (click)="policy.set('valid')"
        >
          <span class="font-medium">Valid rows only</span>
          <span class="text-[13px] text-[color:var(--proto-muted)]">
            Commit writes good rows. Invalid rows stay in the batch for download.
          </span>
        </button>
        <button
          type="button"
          class="proto-choice"
          [class.proto-choice-on]="policy() === 'all'"
          (click)="policy.set('all')"
        >
          <span class="font-medium">All or nothing</span>
          <span class="text-[13px] text-[color:var(--proto-muted)]">
            If any row fails, the registry does not change.
          </span>
        </button>
      </div>
    </section>
  `,
})
export class PrototypeSettings {
  protected readonly policy = signal<'valid' | 'all'>('valid');
}
