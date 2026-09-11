import { Component, effect, inject, signal } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { AuthStore } from '../core/auth.store';
import { SettingsStore } from '../core/settings.store';
import { StatusBanner } from '../shared/status-banner';

@Component({
  selector: 'ccdr-settings',
  imports: [HlmButton, StatusBanner, ...HlmCardImports],
  template: `
    <div class="grid gap-6">
      <ccdr-status [error]="store.error()" [notice]="store.notice()" />

      <section hlmCard class="max-w-xl">
        <div hlmCardHeader>
          <h2 hlmCardTitle>Upload commit policy</h2>
          <p hlmCardDescription>
            Staged workbooks never write until someone commits. Choose whether a bad row blocks the
            rest of the file.
          </p>
        </div>
        <div hlmCardContent class="grid gap-3">
          @if (store.loading()) {
            <p class="text-muted-foreground text-sm">Loading settings…</p>
          } @else {
            <button
              type="button"
              class="rounded-md border px-4 py-3 text-left"
              [class.border-primary]="policy() === 'ValidOnly'"
              [class.bg-accent]="policy() === 'ValidOnly'"
              [class.border-border]="policy() !== 'ValidOnly'"
              [disabled]="!auth.canSettingsWrite()"
              (click)="policy.set('ValidOnly')"
            >
              <span class="block text-sm font-medium">Valid rows only</span>
              <span class="text-muted-foreground mt-1 block text-sm">
                Commit writes good rows. Invalid rows stay in the batch for download.
              </span>
            </button>
            <button
              type="button"
              class="rounded-md border px-4 py-3 text-left"
              [class.border-primary]="policy() === 'AllOrNothing'"
              [class.bg-accent]="policy() === 'AllOrNothing'"
              [class.border-border]="policy() !== 'AllOrNothing'"
              [disabled]="!auth.canSettingsWrite()"
              (click)="policy.set('AllOrNothing')"
            >
              <span class="block text-sm font-medium">All or nothing</span>
              <span class="text-muted-foreground mt-1 block text-sm">
                If any row fails, the registry does not change.
              </span>
            </button>
            @if (auth.canSettingsWrite()) {
              <button hlmBtn class="mt-1 w-fit" type="button" [disabled]="store.saving()" (click)="onSave()">
                {{ store.saving() ? 'Saving…' : 'Save policy' }}
              </button>
            }
          }
        </div>
      </section>
    </div>
  `,
})
export class SettingsPage {
  protected readonly auth = inject(AuthStore);
  protected readonly store = inject(SettingsStore);
  protected readonly policy = signal<'ValidOnly' | 'AllOrNothing'>('ValidOnly');

  constructor() {
    effect(() => {
      if (this.auth.tenantSlug()) {
        void this.store.load();
      }
    });
    effect(() => {
      const current = this.store.settings()?.uploadCommitPolicy;
      if (current) this.policy.set(current);
    });
  }

  protected onSave() {
    void this.store.save(this.policy());
  }
}
