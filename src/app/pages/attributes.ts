import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormField, form, required } from '@angular/forms/signals';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmCheckbox } from '@spartan-ng/helm/checkbox';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { RouterLink } from '@angular/router';
import { AttributesStore } from '../core/attributes.store';
import { AuthStore } from '../core/auth.store';
import { DATA_TYPES, DataType } from '../core/models';
import { StatusBanner } from '../shared/status-banner';

@Component({
  selector: 'ccdr-attributes',
  imports: [
    FormField,
    RouterLink,
    HlmBadge,
    HlmButton,
    HlmCheckbox,
    HlmInput,
    HlmLabel,
    StatusBanner,
    ...HlmAlertImports,
    ...HlmCardImports,
    ...HlmTableImports,
  ],
  template: `
    <div class="grid gap-6">
      <ccdr-status [error]="store.error()" [notice]="store.notice()" />

      <label class="grid max-w-xs gap-1.5 text-sm font-medium">
        Record type
        <select
          hlmInput
          [value]="store.recordType()"
          [disabled]="!store.recordTypes().length"
          (change)="onType($event)"
        >
          @if (!store.recordTypes().length) {
            <option value="">No record types yet</option>
          }
          @for (type of store.recordTypes(); track type.code) {
            <option [value]="type.code">{{ type.label }}</option>
          }
        </select>
      </label>

      @if (!store.loading() && !store.recordTypes().length) {
        <div hlmAlert>
          <p hlmAlertTitle>Create a record type first</p>
          <p hlmAlertDescription>
            Attributes belong to one type and are not shared.
            <a routerLink="/app/record-types" class="text-foreground underline-offset-4 hover:underline">
              Add a record type
            </a>
            as Tenant Admin.
          </p>
        </div>
      }

      @if (store.matchKeyWarning()) {
        <div hlmAlert>
          <p hlmAlertTitle>Match key</p>
          <p hlmAlertDescription>{{ store.matchKeyWarning() }}</p>
        </div>
      }

      @if (store.loading()) {
        <p class="text-muted-foreground text-sm">Loading catalog…</p>
      } @else if (store.recordType() && !store.attributes().length) {
        <p class="text-muted-foreground text-sm">
          No attributes on this record type yet. Add a match-key field before you import records.
        </p>
      } @else {
        @for (group of groups(); track group) {
          <section hlmCard>
            <div hlmCardHeader class="border-border border-b">
              <h2 hlmCardTitle>{{ group }}</h2>
            </div>
            <div hlmCardContent class="p-0">
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
                    @for (attr of byGroup(group); track attr.code) {
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
            </div>
          </section>
        }
      }

      @if (auth.canCatalogWrite() && store.recordType()) {
        <section hlmCard class="max-w-3xl">
          <div hlmCardHeader>
            <h2 hlmCardTitle>Add attribute</h2>
            <p hlmCardDescription>Code cannot change after save. It is unique on this record type only.</p>
          </div>
          <div hlmCardContent>
            <form class="grid gap-3 md:grid-cols-2" (submit)="onCreate($event)">
              <label class="grid gap-1.5 text-sm font-medium">
                Code
                <input hlmInput [formField]="createForm.code" placeholder="phone" />
              </label>
              <label class="grid gap-1.5 text-sm font-medium">
                Label
                <input hlmInput [formField]="createForm.label" placeholder="Phone" />
              </label>
              <label class="grid gap-1.5 text-sm font-medium">
                Group
                <input hlmInput [formField]="createForm.group" placeholder="Contact" />
              </label>
              <label class="grid gap-1.5 text-sm font-medium">
                Data type
                <select hlmInput [formField]="createForm.dataType">
                  @for (type of types; track type) {
                    <option [value]="type">{{ type }}</option>
                  }
                </select>
              </label>
              <label hlmLabel class="font-normal">
                <hlm-checkbox [formField]="createForm.matchKey" />
                Match key
              </label>
              <label hlmLabel class="font-normal">
                <hlm-checkbox [formField]="createForm.required" />
                Required
              </label>
              <label hlmLabel class="font-normal">
                <hlm-checkbox [formField]="createForm.filterable" />
                Filterable
              </label>
              <label hlmLabel class="font-normal">
                <hlm-checkbox [formField]="createForm.listVisible" />
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
    group: '',
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

  protected readonly groups = computed(() => {
    const names = this.store.attributes().map((attr) => attr.group?.trim() || 'Ungrouped');
    return [...new Set(names)];
  });

  constructor() {
    effect(() => {
      if (this.auth.tenantSlug()) {
        void this.store.load();
      }
    });
  }

  protected byGroup(group: string) {
    return this.store.attributes().filter((attr) => (attr.group?.trim() || 'Ungrouped') === group);
  }

  protected onType(event: Event) {
    void this.store.setRecordType((event.target as HTMLSelectElement).value);
  }

  protected onCreate(event: Event) {
    event.preventDefault();
    const value = this.model();
    void this.store
      .create({
        code: value.code.trim(),
        label: value.label.trim(),
        group: value.group.trim() || null,
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
          group: '',
          dataType: 'Text',
          matchKey: false,
          required: false,
          filterable: true,
          listVisible: true,
        }),
      );
  }
}
