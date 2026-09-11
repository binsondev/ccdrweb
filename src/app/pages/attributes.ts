import { Component, effect, inject, signal } from '@angular/core';
import { FormField, form, required } from '@angular/forms/signals';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { AttributesStore } from '../core/attributes.store';
import { AuthStore } from '../core/auth.store';
import { DATA_TYPES, DataType } from '../core/models';
import { StatusBanner } from '../shared/status-banner';

@Component({
  selector: 'ccdr-attributes',
  imports: [FormField, HlmBadge, HlmButton, HlmInput, StatusBanner, ...HlmCardImports, ...HlmTableImports],
  template: `
    <div class="grid gap-6">
      <header class="flex flex-col gap-1">
        <h1 class="text-2xl font-semibold tracking-tight">Attributes</h1>
        <p class="text-muted-foreground text-sm">
          This tenant’s catalog. There is no fixed customer class — every column here becomes a field
          on customer bags and Excel mappings.
        </p>
      </header>

      <ccdr-status [error]="store.error()" [notice]="store.notice()" />

      @if (store.matchKeyWarning()) {
        <p class="text-muted-foreground text-sm">{{ store.matchKeyWarning() }}</p>
      }

      <section hlmCard>
        <div hlmCardContent>
          @if (store.loading()) {
            <p class="text-muted-foreground text-sm">Loading catalog…</p>
          } @else if (!store.attributes().length) {
            <p class="text-muted-foreground text-sm">
              No attributes yet. Add a match-key field before you import customers.
            </p>
          } @else {
            <div hlmTableContainer>
              <table hlmTable>
                <thead hlmTHead>
                  <tr hlmTr>
                    <th hlmTh>Code</th>
                    <th hlmTh>Label</th>
                    <th hlmTh>Type</th>
                    <th hlmTh>Flags</th>
                    @if (auth.canCatalogWrite()) {
                      <th hlmTh></th>
                    }
                  </tr>
                </thead>
                <tbody hlmTBody>
                  @for (attr of store.attributes(); track attr.code) {
                    <tr hlmTr>
                      <td hlmTd class="font-mono text-xs">{{ attr.code }}</td>
                      <td hlmTd>{{ attr.label }}</td>
                      <td hlmTd>{{ attr.dataType }}</td>
                      <td hlmTd>
                        <div class="flex flex-wrap gap-1">
                          @if (attr.matchKey) {
                            <span hlmBadge>Match key</span>
                          }
                          @if (attr.required) {
                            <span hlmBadge variant="secondary">Required</span>
                          }
                          @if (attr.filterable) {
                            <span hlmBadge variant="outline">Filterable</span>
                          }
                          @if (!attr.active) {
                            <span hlmBadge variant="destructive">Inactive</span>
                          }
                        </div>
                      </td>
                      @if (auth.canCatalogWrite()) {
                        <td hlmTd>
                          <button hlmBtn variant="ghost" size="sm" type="button" (click)="store.toggleActive(attr)">
                            {{ attr.active ? 'Deactivate' : 'Activate' }}
                          </button>
                        </td>
                      }
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      </section>

      @if (auth.canCatalogWrite()) {
        <section hlmCard>
          <div hlmCardHeader>
            <h2 hlmCardTitle>Add attribute</h2>
            <p hlmCardDescription>Code cannot change after save.</p>
          </div>
          <div hlmCardContent>
            <form class="grid gap-3 md:grid-cols-2" (submit)="onCreate($event)">
              <label class="grid gap-1 text-sm">
                Code
                <input hlmInput [formField]="createForm.code" placeholder="phone" />
              </label>
              <label class="grid gap-1 text-sm">
                Label
                <input hlmInput [formField]="createForm.label" placeholder="Phone" />
              </label>
              <label class="grid gap-1 text-sm">
                Data type
                <select hlmInput [formField]="createForm.dataType">
                  @for (type of types; track type) {
                    <option [value]="type">{{ type }}</option>
                  }
                </select>
              </label>
              <label class="flex items-center gap-2 text-sm">
                <input type="checkbox" [formField]="createForm.matchKey" />
                Match key
              </label>
              <label class="flex items-center gap-2 text-sm">
                <input type="checkbox" [formField]="createForm.required" />
                Required
              </label>
              <label class="flex items-center gap-2 text-sm">
                <input type="checkbox" [formField]="createForm.filterable" />
                Filterable
              </label>
              <label class="flex items-center gap-2 text-sm">
                <input type="checkbox" [formField]="createForm.listVisible" />
                Show in list
              </label>
              <div class="md:col-span-2">
                <button hlmBtn type="submit" [disabled]="store.saving()">
                  {{ store.saving() ? 'Saving…' : 'Create attribute' }}
                </button>
              </div>
            </form>
          </div>
        </section>
      }
    </div>
  `,
})
export class AttributesPage {
  protected readonly auth = inject(AuthStore);
  protected readonly store = inject(AttributesStore);
  protected readonly types = DATA_TYPES;
  protected readonly model = signal({
    code: '',
    label: '',
    dataType: 'Text' as DataType,
    matchKey: false,
    required: false,
    filterable: true,
    listVisible: true,
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
        dataType: value.dataType,
        matchKey: value.matchKey,
        required: value.required,
        filterable: value.filterable,
        listVisible: value.listVisible,
        pii: false,
        active: true,
      })
      .then(() =>
        this.model.set({
          code: '',
          label: '',
          dataType: 'Text',
          matchKey: false,
          required: false,
          filterable: true,
          listVisible: true,
        }),
      );
  }
}
