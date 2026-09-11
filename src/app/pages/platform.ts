import { Component, inject, signal } from '@angular/core';
import { FormField, form, required } from '@angular/forms/signals';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmInput } from '@spartan-ng/helm/input';
import { BUSINESS_TYPES } from '../core/models';
import { PlatformStore } from '../core/platform.store';
import { StatusBanner } from '../shared/status-banner';

@Component({
  selector: 'ccdr-platform',
  imports: [FormField, HlmBadge, HlmButton, HlmInput, StatusBanner, ...HlmCardImports],
  template: `
    <div class="grid gap-6">
      <ccdr-status [error]="store.error()" [notice]="store.notice()" />

      @if (store.loading()) {
        <p class="text-muted-foreground text-sm">Loading tenants…</p>
      } @else if (!store.tenants().length) {
        <p class="text-muted-foreground text-sm">No tenants registered yet.</p>
      } @else {
        <div class="grid gap-4 md:grid-cols-3">
          @for (tenant of store.tenants(); track tenant.id) {
            <article hlmCard>
              <div hlmCardHeader>
                <span hlmBadge variant="outline">{{ tenant.businessType }}</span>
                <h2 hlmCardTitle>{{ tenant.name }}</h2>
                <p hlmCardDescription class="font-mono">{{ tenant.identifier }}</p>
              </div>
              <div hlmCardContent>
                <form class="grid gap-2" (submit)="onAdmin(tenant.id, $event)">
                  <input hlmInput name="email" type="email" required placeholder="admin@tenant.org" />
                  <button hlmBtn variant="outline" size="sm" type="submit">Assign first admin</button>
                </form>
              </div>
            </article>
          }
        </div>
      }

      <section hlmCard class="max-w-3xl">
        <div hlmCardHeader>
          <h2 hlmCardTitle>Create tenant</h2>
          <p hlmCardDescription>Identifier is a lowercase slug, for example riverside.</p>
        </div>
        <div hlmCardContent>
          <form class="grid gap-3 md:grid-cols-3" (submit)="onCreate($event)">
            <input hlmInput placeholder="riverside" [formField]="createForm.identifier" />
            <input hlmInput placeholder="Riverside School" [formField]="createForm.name" />
            <select hlmInput [formField]="createForm.businessType">
              @for (type of types; track type) {
                <option [value]="type">{{ type }}</option>
              }
            </select>
            <div class="md:col-span-3">
              <button hlmBtn type="submit" [disabled]="store.saving()">
                {{ store.saving() ? 'Creating…' : 'Create tenant' }}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  `,
})
export class PlatformPage {
  protected readonly store = inject(PlatformStore);
  protected readonly types = BUSINESS_TYPES;
  protected readonly model = signal({
    identifier: '',
    name: '',
    businessType: 'Other',
  });
  protected readonly createForm = form(this.model, (schema) => {
    required(schema.identifier);
    required(schema.name);
  });

  constructor() {
    void this.store.load();
  }

  protected onCreate(event: Event) {
    event.preventDefault();
    const value = this.model();
    void this.store.create(value.identifier.trim(), value.name.trim(), value.businessType).then(() =>
      this.model.set({ identifier: '', name: '', businessType: 'Other' }),
    );
  }

  protected onAdmin(tenantId: string, event: Event) {
    event.preventDefault();
    const email = String(new FormData(event.target as HTMLFormElement).get('email') ?? '').trim();
    if (email) {
      void this.store.assignAdmin(tenantId, email);
    }
  }
}
