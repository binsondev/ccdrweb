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
import { AttributeDefinition, DATA_TYPES, DataType } from '../core/models';
import { StatusBanner } from '../shared/status-banner';

type AttributeDraft = {
  code: string;
  label: string;
  group: string;
  dataType: DataType;
  helpText: string;
  matchKey: boolean;
  required: boolean;
  filterable: boolean;
  listVisible: boolean;
  pii: boolean;
  active: boolean;
};

type OptionDraft = { value: string; label: string };

const emptyDraft = (): AttributeDraft => ({
  code: '',
  label: '',
  group: '',
  dataType: 'Text',
  helpText: '',
  matchKey: false,
  required: false,
  filterable: true,
  listVisible: true,
  pii: false,
  active: true,
});

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
                      <tr hlmTr [class.bg-muted/40]="editingCode() === attr.code">
                        <td hlmTd class="font-mono text-xs">{{ attr.code }}</td>
                        <td hlmTd>
                          <div>{{ attr.label }}</div>
                          @if (attr.helpText) {
                            <p class="text-muted-foreground text-xs">{{ attr.helpText }}</p>
                          }
                        </td>
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
                            <div class="flex flex-wrap gap-1">
                              <button hlmBtn variant="ghost" size="sm" type="button" (click)="startEdit(attr)">
                                {{ editingCode() === attr.code ? 'Editing' : 'Edit' }}
                              </button>
                              <button
                                hlmBtn
                                variant="ghost"
                                size="sm"
                                type="button"
                                [disabled]="store.saving()"
                                (click)="store.toggleActive(attr)"
                              >
                                {{ attr.active ? 'Deactivate' : 'Activate' }}
                              </button>
                            </div>
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
            <h2 hlmCardTitle>{{ editingCode() ? 'Edit attribute' : 'Add attribute' }}</h2>
            <p hlmCardDescription>
              @if (editingCode()) {
                Code and data type stay as they were. Label, flags, help text, and dropdown options can change.
              } @else {
                Code cannot change after save. It is unique on this record type only.
              }
            </p>
          </div>
          <div hlmCardContent>
            <form class="grid gap-3 md:grid-cols-2" (submit)="onSave($event)">
              <label class="grid gap-1.5 text-sm font-medium">
                Code
                <input
                  hlmInput
                  [formField]="draftForm.code"
                  [readonly]="!!editingCode()"
                  placeholder="phone"
                />
              </label>
              <label class="grid gap-1.5 text-sm font-medium">
                Label
                <input hlmInput [formField]="draftForm.label" placeholder="Phone" />
              </label>
              <label class="grid gap-1.5 text-sm font-medium">
                Group
                <input hlmInput [formField]="draftForm.group" placeholder="Contact" />
              </label>
              <label class="grid gap-1.5 text-sm font-medium">
                Data type
                <select hlmInput [formField]="draftForm.dataType" [disabled]="!!editingCode()" (change)="onDataType()">
                  @for (type of types; track type) {
                    <option [value]="type">{{ type }}</option>
                  }
                </select>
              </label>
              <label class="grid gap-1.5 text-sm font-medium md:col-span-2">
                Help text
                <input hlmInput [formField]="draftForm.helpText" placeholder="Shown on the record form" />
              </label>
              <label hlmLabel class="font-normal">
                <hlm-checkbox [formField]="draftForm.matchKey" />
                Match key
              </label>
              <label hlmLabel class="font-normal">
                <hlm-checkbox [formField]="draftForm.required" />
                Required
              </label>
              <label hlmLabel class="font-normal">
                <hlm-checkbox [formField]="draftForm.filterable" />
                Filterable
              </label>
              <label hlmLabel class="font-normal">
                <hlm-checkbox [formField]="draftForm.listVisible" />
                Show in list
              </label>
              <label hlmLabel class="font-normal">
                <hlm-checkbox [formField]="draftForm.pii" />
                PII
              </label>
              @if (editingCode()) {
                <label hlmLabel class="font-normal">
                  <hlm-checkbox [formField]="draftForm.active" />
                  Active
                </label>
              }

              @if (model().dataType === 'Dropdown') {
                <div class="grid gap-2 md:col-span-2">
                  <div class="flex items-center justify-between gap-2">
                    <p class="text-sm font-medium">Dropdown options</p>
                    <button hlmBtn variant="outline" size="sm" type="button" (click)="addOption()">
                      Add option
                    </button>
                  </div>
                  @if (!options().length) {
                    <p class="text-muted-foreground text-sm">No options yet. Add at least one value.</p>
                  }
                  @for (option of options(); track $index) {
                    <div class="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                      <input
                        hlmInput
                        [value]="option.value"
                        placeholder="value"
                        (input)="patchOption($index, 'value', $event)"
                      />
                      <input
                        hlmInput
                        [value]="option.label"
                        placeholder="Label"
                        (input)="patchOption($index, 'label', $event)"
                      />
                      <button hlmBtn variant="ghost" size="sm" type="button" (click)="removeOption($index)">
                        Remove
                      </button>
                    </div>
                  }
                </div>
              }

              <div class="flex flex-wrap gap-2 md:col-span-2">
                <button hlmBtn type="submit" [disabled]="store.saving()">
                  @if (store.saving()) {
                    Saving…
                  } @else if (editingCode()) {
                    Save changes
                  } @else {
                    Create attribute
                  }
                </button>
                @if (editingCode()) {
                  <button hlmBtn variant="outline" type="button" [disabled]="store.saving()" (click)="cancelEdit()">
                    Cancel
                  </button>
                }
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
  protected readonly editingCode = signal<string | null>(null);
  protected readonly options = signal<OptionDraft[]>([]);
  protected readonly model = signal<AttributeDraft>(emptyDraft());
  protected readonly draftForm = form(this.model, (schema) => {
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

  protected startEdit(attr: AttributeDefinition) {
    this.editingCode.set(attr.code);
    this.model.set({
      code: attr.code,
      label: attr.label,
      group: attr.group ?? '',
      dataType: attr.dataType,
      helpText: attr.helpText ?? '',
      matchKey: attr.matchKey,
      required: attr.required,
      filterable: attr.filterable,
      listVisible: attr.listVisible,
      pii: attr.pii,
      active: attr.active,
    });
    this.options.set(attr.options.map((option) => ({ value: option.value, label: option.label })));
  }

  protected cancelEdit() {
    this.editingCode.set(null);
    this.model.set(emptyDraft());
    this.options.set([]);
  }

  protected onType(event: Event) {
    this.cancelEdit();
    void this.store.setRecordType((event.target as HTMLSelectElement).value);
  }

  protected onDataType() {
    if (this.model().dataType !== 'Dropdown') {
      this.options.set([]);
    } else if (!this.options().length) {
      this.options.set([{ value: '', label: '' }]);
    }
  }

  protected addOption() {
    this.options.update((current) => [...current, { value: '', label: '' }]);
  }

  protected removeOption(index: number) {
    this.options.update((current) => current.filter((_, i) => i !== index));
  }

  protected patchOption(index: number, key: keyof OptionDraft, event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.options.update((current) =>
      current.map((option, i) => (i === index ? { ...option, [key]: value } : option)),
    );
  }

  protected onSave(event: Event) {
    event.preventDefault();
    const value = this.model();
    const options =
      value.dataType === 'Dropdown'
        ? this.options()
            .map((option) => ({
              value: option.value.trim(),
              label: (option.label || option.value).trim(),
            }))
            .filter((option) => option.value.length > 0)
            .map((option, index) => ({ ...option, sortOrder: (index + 1) * 10 }))
        : [];
    const payload = {
      code: value.code.trim(),
      label: value.label.trim(),
      group: value.group.trim() || null,
      dataType: value.dataType,
      matchKey: value.matchKey,
      required: value.required,
      filterable: value.filterable,
      listVisible: value.listVisible,
      pii: value.pii,
      active: value.active,
      helpText: value.helpText.trim() || null,
      options,
    };

    const done = (ok: boolean) => {
      if (ok) this.cancelEdit();
    };

    if (this.editingCode()) {
      void this.store.update(this.editingCode()!, payload).then(done);
      return;
    }

    void this.store.create(payload).then(done);
  }
}
