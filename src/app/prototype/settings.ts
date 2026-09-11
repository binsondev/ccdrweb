import { Component, signal } from '@angular/core';
import { HlmCardImports } from '@spartan-ng/helm/card';

@Component({
  selector: 'ccdr-proto-settings',
  imports: [...HlmCardImports],
  template: `
    <section hlmCard class="max-w-xl">
      <div hlmCardHeader>
        <h2 hlmCardTitle>Upload commit policy</h2>
        <p hlmCardDescription>
          Staged workbooks never write until someone commits. Choose whether a bad row blocks the
          rest of the file.
        </p>
      </div>
      <div hlmCardContent class="grid gap-3">
        <button
          type="button"
          class="rounded-md border px-4 py-3 text-left"
          [class.border-primary]="policy() === 'valid'"
          [class.bg-accent]="policy() === 'valid'"
          [class.border-border]="policy() !== 'valid'"
          (click)="policy.set('valid')"
        >
          <span class="block text-sm font-medium">Valid rows only</span>
          <span class="text-muted-foreground mt-1 block text-sm">
            Commit writes good rows. Invalid rows stay in the batch for download.
          </span>
        </button>
        <button
          type="button"
          class="rounded-md border px-4 py-3 text-left"
          [class.border-primary]="policy() === 'all'"
          [class.bg-accent]="policy() === 'all'"
          [class.border-border]="policy() !== 'all'"
          (click)="policy.set('all')"
        >
          <span class="block text-sm font-medium">All or nothing</span>
          <span class="text-muted-foreground mt-1 block text-sm">
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
