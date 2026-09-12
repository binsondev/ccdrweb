import { Component, effect, inject, signal } from '@angular/core';
import { FormField, form, required } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { AuthStore } from '../core/auth.store';
import { RecordTypesStore } from '../core/record-types.store';
import { StatusBanner } from '../shared/status-banner';

@Component({
  selector: 'ccdr-record-types',
  imports: [
    FormField,
    RouterLink,
    HlmBadge,
    HlmButton,
    HlmInput,
    StatusBanner,
    ...HlmAlertImports,
    ...HlmCardImports,
    ...HlmTableImports,
  ],
  template: `
    <div class="grid gap-6">
      <ccdr-status [error]="store.error()" [notice]="store.notice()" />

      @if (store.loading()) {
        <p class="text-muted-foreground text-sm">Loading record types…</p>
      } @else if (!store.recordTypes().length) {
        <div hlmAlert>
          <p hlmAlertTitle>Empty catalog</p>
          <p hlmAlertDescription>
            This tenant has no record types yet. Tenant Admin creates them — Patient, Vendor, Staff,
            or whatever this workspace stores. Attributes and mappings are added after that, one type
            at a time.
          </p>
        </div>
      } @else {
        <section hlmCard>
          <div hlmCardHeader class="border-border border-b">
            <h2 hlmCardTitle>Types</h2>
            <p hlmCardDescription>Code cannot change after save. Label and active may.</p>
          </div>
          <div hlmCardContent class="p-0">
            <div hlmTableContainer>
              <table hlmTable>
                <thead hlmTHead>
                  <tr hlmTr>
                    <th hlmTh>Code</th>
                    <th hlmTh>Label</th>
                    <th hlmTh>Status</th>
                    @if (auth.canCatalogWrite()) {
                      <th hlmTh></th>
                    }
                  </tr>
                </thead>
                <tbody hlmTBody>
                  @for (type of store.recordTypes(); track type.code) {
                    <tr hlmTr>
                      <td hlmTd class="font-mono text-xs">{{ type.code }}</td>
                      <td hlmTd>
                        <div>{{ type.label }}</div>
                        @if (type.description) {
                          <p class="text-muted-foreground text-xs">{{ type.description }}</p>
                        }
                      </td>
                      <td hlmTd>
                        @if (type.active) {
                          <span hlmBadge>Active</span>
                        } @else {
                          <span hlmBadge variant="destructive">Inactive</span>
                        }
                      </td>
                      @if (auth.canCatalogWrite()) {
                        <td hlmTd>
                          <button hlmBtn variant="ghost" size="sm" type="button" (click)="store.toggleActive(type)">
                            {{ type.active ? 'Deactivate' : 'Activate' }}
                          </button>
                        </td>
                      }
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </section>
        <p class="text-muted-foreground text-sm">
          Next:
          <a routerLink="/app/attributes" class="text-foreground underline-offset-4 hover:underline">
            add attributes
          </a>
          for each type, then a mapper.
        </p>
      }

      @if (auth.canCatalogWrite()) {
        <section hlmCard class="max-w-xl">
          <div hlmCardHeader>
            <h2 hlmCardTitle>Add record type</h2>
            <p hlmCardDescription>Use a stable snake_case code such as patient or vendor.</p>
          </div>
          <div hlmCardContent>
            <form class="grid gap-3" (submit)="onCreate($event)">
              <label class="grid gap-1.5 text-sm font-medium">
                Code
                <input hlmInput [formField]="createForm.code" placeholder="patient" />
              </label>
              <label class="grid gap-1.5 text-sm font-medium">
                Label
                <input hlmInput [formField]="createForm.label" placeholder="Patient" />
              </label>
              <label class="grid gap-1.5 text-sm font-medium">
                Description
                <input hlmInput [formField]="createForm.description" placeholder="Clinical encounters" />
              </label>
              <button hlmBtn class="w-fit" type="submit" [disabled]="store.saving()">
                {{ store.saving() ? 'Saving…' : 'Create record type' }}
              </button>
            </form>
          </div>
        </section>
      }
    </div>
  `,
})
export class RecordTypesPage {
  protected readonly auth = inject(AuthStore);
  protected readonly store = inject(RecordTypesStore);
  protected readonly model = signal({
    code: '',
    label: '',
    description: '',
  });
  protected readonly createForm = form(this.model, (schema) => {
    required(schema.code);
    required(schema.label);
  });

  constructor() {
    effect(() => {
      if (this.auth.tenantSlug()) {
        void this.store.load();
      }
    });
  }

  protected onCreate(event: Event) {
    event.preventDefault();
    const value = this.model();
    void this.store
      .create({
        code: value.code.trim(),
        label: value.label.trim(),
        description: value.description.trim() || null,
      })
      .then((ok) => {
        if (ok) {
          this.model.set({ code: '', label: '', description: '' });
        }
      });
  }
}
