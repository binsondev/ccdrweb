import { Component, effect, inject } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmInput } from '@spartan-ng/helm/input';
import { AuthStore } from '../core/auth.store';
import { SettingsStore } from '../core/settings.store';
import { StatusBanner } from '../shared/status-banner';

@Component({
  selector: 'ccdr-settings',
  imports: [HlmButton, HlmInput, StatusBanner, ...HlmCardImports],
  template: `
    <div class="grid gap-6">
      <header class="flex flex-col gap-1">
        <h1 class="text-2xl font-semibold tracking-tight">Tenant settings</h1>
        <p class="text-muted-foreground text-sm">
          Commit policy controls whether a staged workbook writes only valid rows, or nothing if any
          row fails.
        </p>
      </header>

      <ccdr-status [error]="store.error()" [notice]="store.notice()" />

      <section hlmCard>
        <div hlmCardContent>
          @if (store.loading()) {
            <p class="text-muted-foreground text-sm">Loading settings…</p>
          } @else {
            <form class="grid max-w-md gap-3" (submit)="onSave($event)">
              <label class="grid gap-1 text-sm">
                Upload commit policy
                <select hlmInput name="policy" [value]="store.settings()?.uploadCommitPolicy ?? 'ValidOnly'">
                  <option value="ValidOnly">Valid rows only</option>
                  <option value="AllOrNothing">All or nothing</option>
                </select>
              </label>
              @if (auth.canSettingsWrite()) {
                <button hlmBtn type="submit" [disabled]="store.saving()">
                  {{ store.saving() ? 'Saving…' : 'Save policy' }}
                </button>
              }
            </form>
          }
        </div>
      </section>
    </div>
  `,
})
export class SettingsPage {
  protected readonly auth = inject(AuthStore);
  protected readonly store = inject(SettingsStore);

  constructor() {
    effect(() => {
      if (this.auth.tenantSlug()) {
        void this.store.load();
      }
    });
  }

  protected onSave(event: Event) {
    event.preventDefault();
    const policy = String(new FormData(event.target as HTMLFormElement).get('policy'));
    if (policy === 'ValidOnly' || policy === 'AllOrNothing') {
      void this.store.save(policy);
    }
  }
}
