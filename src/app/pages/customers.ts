import { Component, computed, effect, inject, signal } from '@angular/core';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmCheckbox } from '@spartan-ng/helm/checkbox';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmSeparator } from '@spartan-ng/helm/separator';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { AuthStore } from '../core/auth.store';
import { CustomersStore, type FilterChip } from '../core/customers.store';
import { displayValue, operatorLabel } from '../core/format';
import { Customer, FilterableAttribute } from '../core/models';
import { StatusBanner } from '../shared/status-banner';

@Component({
  selector: 'ccdr-customers',
  imports: [
    HlmButton,
    HlmCheckbox,
    HlmInput,
    HlmLabel,
    HlmSeparator,
    StatusBanner,
    ...HlmAlertImports,
    ...HlmCardImports,
    ...HlmTableImports,
  ],
  template: `
    <div class="grid gap-4">
      <ccdr-status [error]="store.error()" [notice]="store.notice()" />

      @if (store.matchKeyWarning()) {
        <div hlmAlert>
          <p hlmAlertTitle>Match key</p>
          <p hlmAlertDescription>{{ store.matchKeyWarning() }}</p>
        </div>
      }

      <div class="flex flex-wrap gap-2">
        <button
          hlmBtn
          variant="outline"
          size="sm"
          class="lg:hidden"
          type="button"
          (click)="panelOpen.set(!panelOpen())"
        >
          {{ panelOpen() ? 'Hide filters' : 'Show filters' }}
        </button>
        @if (auth.canCustomerWrite()) {
          <button hlmBtn size="sm" class="ml-auto" type="button" (click)="openCompose()">
            New record
          </button>
        }
      </div>

      <div class="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start">
        <aside class="lg:sticky lg:top-4 lg:block" [class.hidden]="!panelOpen()">
          <section hlmCard size="sm">
            <div hlmCardHeader class="border-border border-b">
              <div class="flex items-center justify-between gap-2">
                <h2 hlmCardTitle>Filters</h2>
                @if (store.chips().length) {
                  <button hlmBtn variant="ghost" size="xs" type="button" (click)="clearAll()">
                    Clear all
                  </button>
                }
              </div>
              <p hlmCardDescription>
                Only catalog fields marked filterable appear here. Every selected filter applies together.
              </p>
            </div>
            <div hlmCardContent class="grid gap-5 py-4">
              <label class="grid gap-1.5 text-sm font-medium">
                Record type
                <select hlmInput [value]="store.recordType()" (change)="onRecordType($event)">
                  <option value="">All types</option>
                  @for (type of store.recordTypes(); track type.code) {
                    <option [value]="type.code">{{ type.label }}</option>
                  }
                </select>
              </label>
              @if (!store.recordTypes().length && !store.loading()) {
                <p class="text-muted-foreground text-sm">
                  No record types yet. Tenant Admin adds them under Catalog.
                </p>
              }
              @if (!store.filterable().length && !store.loading() && store.recordTypes().length) {
                <p class="text-muted-foreground text-sm">
                  No filterable attributes in this catalog yet.
                </p>
              }
              @for (group of store.groups(); track group) {
                <section>
                  <h3 class="text-muted-foreground mb-3 text-[10px] font-semibold tracking-[0.16em] uppercase">
                    {{ store.recordType() ? group : store.typeLabel()(group) }}
                  </h3>
                  <div class="grid gap-4">
                    @for (attr of inGroup(group); track attr.recordType + ':' + attr.code) {
                      <div>
                        <p class="mb-2 text-xs font-medium">{{ attr.label }}</p>
                        @switch (attr.dataType) {
                          @case ('Dropdown') {
                            <ul class="grid gap-2">
                              @for (opt of attr.options; track opt.value) {
                                <li>
                                  <label hlmLabel class="font-normal">
                                    <hlm-checkbox
                                      [checked]="selectedOptions(attr.code).includes(opt.value)"
                                      (checkedChange)="onOption(attr.code, opt.value, $event)"
                                    />
                                    {{ opt.label }}
                                  </label>
                                </li>
                              }
                            </ul>
                          }
                          @case ('Boolean') {
                            <div class="flex flex-wrap gap-1">
                              @for (choice of boolChoices; track choice.value) {
                                <button
                                  hlmBtn
                                  size="xs"
                                  type="button"
                                  [variant]="boolValue(attr.code) === choice.value ? 'default' : 'outline'"
                                  (click)="onBool(attr.code, choice.value)"
                                >
                                  {{ choice.label }}
                                </button>
                              }
                            </div>
                          }
                          @case ('Integer') {
                            <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                              <input
                                hlmInput
                                type="number"
                                [value]="minValue(attr.code)"
                                (input)="onMin(attr.code, $event)"
                                placeholder="Min"
                              />
                              <span class="text-muted-foreground text-xs">to</span>
                              <input
                                hlmInput
                                type="number"
                                [value]="maxValue(attr.code)"
                                (input)="onMax(attr.code, $event)"
                                placeholder="Max"
                              />
                            </div>
                          }
                          @case ('Decimal') {
                            <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                              <input
                                hlmInput
                                type="number"
                                step="0.01"
                                [value]="minValue(attr.code)"
                                (input)="onMin(attr.code, $event)"
                                placeholder="Min"
                              />
                              <span class="text-muted-foreground text-xs">to</span>
                              <input
                                hlmInput
                                type="number"
                                step="0.01"
                                [value]="maxValue(attr.code)"
                                (input)="onMax(attr.code, $event)"
                                placeholder="Max"
                              />
                            </div>
                          }
                          @case ('Date') {
                            <div class="grid grid-cols-2 gap-2">
                              <input
                                hlmInput
                                type="date"
                                [value]="minValue(attr.code)"
                                (input)="onMin(attr.code, $event)"
                              />
                              <input
                                hlmInput
                                type="date"
                                [value]="maxValue(attr.code)"
                                (input)="onMax(attr.code, $event)"
                              />
                            </div>
                          }
                          @case ('DateTime') {
                            <div class="grid grid-cols-1 gap-2">
                              <input
                                hlmInput
                                type="datetime-local"
                                [value]="minValue(attr.code)"
                                (input)="onMin(attr.code, $event)"
                              />
                              <input
                                hlmInput
                                type="datetime-local"
                                [value]="maxValue(attr.code)"
                                (input)="onMax(attr.code, $event)"
                              />
                            </div>
                          }
                          @default {
                            <div class="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-2">
                              <select
                                hlmInput
                                [value]="textDraft(attr).op"
                                (change)="onTextOp(attr.code, $event)"
                              >
                                @for (op of attr.operators; track op) {
                                  <option [value]="op">{{ operatorLabel(op) }}</option>
                                }
                              </select>
                              <input
                                hlmInput
                                type="search"
                                [value]="textDraft(attr).value"
                                (input)="onTextValue(attr.code, attr.operators[0], $event)"
                                [placeholder]="attr.label"
                              />
                            </div>
                          }
                        }
                      </div>
                    }
                  </div>
                </section>
                @if (!$last) {
                  <hlm-separator />
                }
              }
            </div>
          </section>
        </aside>

        <section class="grid min-w-0 gap-4">
          <input
            hlmInput
            type="search"
            placeholder="Search any value across the bag…"
            [value]="store.q()"
            (input)="onQuery($event)"
          />

          @if (store.chips().length) {
            <div class="flex flex-wrap gap-1.5">
              @for (chip of store.chips(); track chip.id) {
                <button hlmBtn variant="secondary" size="xs" type="button" (click)="removeChip(chip)">
                  {{ chip.label }}
                  <span aria-hidden="true">×</span>
                </button>
              }
            </div>
          }

          <p class="text-muted-foreground text-[11px] font-medium tracking-[0.14em] uppercase">
            @if (store.count() === 0) {
              0 records
            } @else {
              Showing {{ store.from() }}–{{ store.to() }} of {{ store.count() }}
            }
          </p>

          <section hlmCard>
            <div hlmCardContent class="p-0">
              @if (store.loading() && !store.customers().length) {
                <p class="text-muted-foreground px-4 py-6 text-sm">Loading customers…</p>
              } @else {
                <div hlmTableContainer>
                  <table hlmTable>
                    <thead hlmTHead>
                      <tr hlmTr>
                        @for (col of columns(); track col.code) {
                          <th hlmTh>{{ col.label }}</th>
                        }
                        <th hlmTh>Updated</th>
                      </tr>
                    </thead>
                    <tbody hlmTBody>
                      @if (!store.customers().length) {
                        <tr hlmTr>
                          <td hlmTd [attr.colspan]="columns().length + 1" class="text-muted-foreground">
                            No records match these filters. Clear a chip or widen the range.
                          </td>
                        </tr>
                      } @else {
                        @for (row of store.customers(); track row.id) {
                          <tr
                            hlmTr
                            class="hover:bg-muted/50 cursor-pointer"
                            [class.bg-muted]="selected()?.id === row.id"
                            (click)="openRecord(row)"
                          >
                            @for (col of columns(); track col.code) {
                              <td hlmTd>{{ cellValue(row, col.code) }}</td>
                            }
                            <td hlmTd class="text-muted-foreground">{{ row.updatedAt.slice(0, 10) }}</td>
                          </tr>
                        }
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>
          </section>

          <div class="flex flex-wrap items-center justify-between gap-3">
            <label class="text-muted-foreground flex items-center gap-2 text-sm">
              Rows
              <select
                hlmInput
                class="w-20"
                [value]="store.limit()"
                [disabled]="store.loading()"
                (change)="onPageSize($event)"
              >
                @for (size of pageSizes; track size) {
                  <option [value]="size">{{ size }}</option>
                }
              </select>
            </label>
            <div class="flex flex-wrap items-center gap-2">
              <button
                hlmBtn
                variant="outline"
                size="sm"
                type="button"
                [disabled]="!store.hasPrev() || store.loading()"
                (click)="store.prevPage()"
              >
                Previous
              </button>
              <span class="text-muted-foreground text-sm">
                Page {{ store.page() }} of {{ store.pageCount() }}
              </span>
              <button
                hlmBtn
                variant="outline"
                size="sm"
                type="button"
                [disabled]="!store.hasNext() || store.loading()"
                (click)="store.nextPage()"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>

    @if (selected(); as row) {
      <div class="bg-foreground/25 fixed inset-0 z-40" (click)="selected.set(null)"></div>
      <aside
        class="bg-card text-card-foreground border-border fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l shadow-lg"
        role="dialog"
        aria-label="Customer record"
        (click)="$event.stopPropagation()"
      >
        <div class="flex items-start justify-between gap-4 px-6 py-5">
          <div>
            <p class="text-muted-foreground text-[11px] font-medium tracking-[0.16em] uppercase">
              Record bag
            </p>
            <h2 class="text-xl font-semibold tracking-tight">{{ recordTitle(row) }}</h2>
            <p class="text-muted-foreground mt-1 text-sm">{{ store.typeLabel()(row.recordType) }}</p>
          </div>
          <button hlmBtn variant="ghost" size="sm" type="button" (click)="selected.set(null)">
            Close
          </button>
        </div>
        <dl class="grid flex-1 gap-4 overflow-y-auto px-6 pb-6">
          @for (attr of attributesFor(row.recordType); track attr.code) {
            @if (attr.active) {
              <div>
                <dt class="text-muted-foreground text-[11px] tracking-[0.12em] uppercase">
                  {{ attr.label }}
                  @if (attr.matchKey) {
                    <span class="text-primary"> · match key</span>
                  }
                </dt>
                <dd>{{ displayValue(row.attributes[attr.code]) }}</dd>
              </div>
            }
          }
        </dl>
      </aside>
    }

    @if (composing()) {
      <div class="bg-foreground/25 fixed inset-0 z-40" (click)="composing.set(false)"></div>
      <aside
        class="bg-card text-card-foreground border-border fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l shadow-lg"
        role="dialog"
        aria-label="New customer"
        (click)="$event.stopPropagation()"
      >
        <div class="flex items-start justify-between px-6 py-5">
          <div>
            <p class="text-muted-foreground text-[11px] font-medium tracking-[0.16em] uppercase">
              Create or update
            </p>
            <h2 class="text-xl font-semibold tracking-tight">New record</h2>
          </div>
          <button hlmBtn variant="ghost" size="sm" type="button" (click)="composing.set(false)">
            Close
          </button>
        </div>
        <form class="grid gap-3 overflow-y-auto px-6 pb-6" (submit)="onCreate($event)">
          <label class="grid gap-1.5 text-sm font-medium">
            Record type
            <select hlmInput name="__recordType" required [value]="composeType()" (change)="onComposeType($event)">
              <option value="" disabled>Choose a type</option>
              @for (type of store.recordTypes(); track type.code) {
                @if (type.active) {
                  <option [value]="type.code">{{ type.label }}</option>
                }
              }
            </select>
          </label>
          @for (attr of attributesFor(composeType()); track attr.code) {
            @if (attr.active) {
              <label class="grid gap-1.5 text-sm font-medium">
                <span>
                  {{ attr.label }}
                  @if (attr.required) {
                    <span class="text-destructive">*</span>
                  }
                  @if (attr.matchKey) {
                    <span class="text-muted-foreground font-normal">(match key)</span>
                  }
                </span>
                <input hlmInput [name]="attr.code" [placeholder]="attr.code" />
              </label>
            }
          }
          <button hlmBtn class="mt-2" type="submit" [disabled]="store.saving()">
            {{ store.saving() ? 'Saving…' : 'Save bag' }}
          </button>
        </form>
      </aside>
    }
  `,
})
export class CustomersPage {
  protected readonly auth = inject(AuthStore);
  protected readonly store = inject(CustomersStore);
  protected readonly displayValue = displayValue;
  protected readonly operatorLabel = operatorLabel;
  protected readonly panelOpen = signal(true);
  protected readonly selected = signal<Customer | null>(null);
  protected readonly composing = signal(false);
  protected readonly composeType = signal('');
  protected readonly boolChoices = [
    { value: '', label: 'Any' },
    { value: 'true', label: 'Yes' },
    { value: 'false', label: 'No' },
  ];
  protected readonly pageSizes = [10, 25, 50];

  protected readonly columns = computed(() => {
    const scoped = this.store.recordType()
      ? this.store.attributes().filter((attr) => attr.recordType === this.store.recordType())
      : this.store.attributes();
    const visible = scoped.filter((attr) => attr.active && attr.listVisible);
    const fields = visible.length ? visible : scoped.filter((attr) => attr.active).slice(0, 4);
    if (this.store.recordType()) return fields;
    return [{ code: '__recordType', label: 'Record type', recordType: '' } as (typeof fields)[number], ...fields];
  });

  constructor() {
    this.store.search(this.store.searchCriteria);
    effect(() => {
      if (this.auth.tenantSlug()) {
        void this.store.load();
      }
    });
  }

  protected inGroup(group: string) {
    if (!this.store.recordType()) {
      return this.store.filterable().filter((attr) => (attr.recordType || 'Other') === group);
    }
    return this.store.filterable().filter((attr) => (attr.group?.trim() || 'Other') === group);
  }

  protected attributesFor(recordType: string) {
    if (!recordType) return [];
    return this.store.attributes().filter((attr) => attr.recordType === recordType);
  }

  protected cellValue(row: Customer, code: string) {
    if (code === '__recordType') return this.store.typeLabel()(row.recordType);
    return displayValue(row.attributes[code]);
  }

  protected onRecordType(event: Event) {
    void this.store.setRecordType((event.target as HTMLSelectElement).value);
  }

  protected onComposeType(event: Event) {
    this.composeType.set((event.target as HTMLSelectElement).value);
  }

  protected textDraft(attr: FilterableAttribute) {
    return this.store.text()[attr.code] ?? { op: attr.operators[0] ?? 'eq', value: '' };
  }

  protected selectedOptions(code: string) {
    return this.store.options()[code] ?? [];
  }

  protected minValue(code: string) {
    return this.store.min()[code] ?? '';
  }

  protected maxValue(code: string) {
    return this.store.max()[code] ?? '';
  }

  protected boolValue(code: string) {
    return this.store.bools()[code] ?? '';
  }

  protected recordTitle(row: Customer) {
    const name = row.attributes['full_name'] ?? row.attributes['name'];
    if (typeof name === 'string' && name.trim()) return name;
    const first = this.columns()[0];
    return first ? displayValue(row.attributes[first.code]) : row.id.slice(0, 8);
  }

  protected onQuery(event: Event) {
    this.store.setSearch((event.target as HTMLInputElement).value);
  }

  protected onTextOp(code: string, event: Event) {
    this.store.setTextOp(code, (event.target as HTMLSelectElement).value);
  }

  protected onTextValue(code: string, fallbackOp: string, event: Event) {
    this.store.setTextValue(code, fallbackOp, (event.target as HTMLInputElement).value);
  }

  protected onOption(code: string, value: string, checked: boolean) {
    this.store.setOption(code, value, checked);
  }

  protected onMin(code: string, event: Event) {
    this.store.setMin(code, (event.target as HTMLInputElement).value);
  }

  protected onMax(code: string, event: Event) {
    this.store.setMax(code, (event.target as HTMLInputElement).value);
  }

  protected onBool(code: string, value: string) {
    this.store.setBool(code, value);
  }

  protected removeChip(chip: FilterChip) {
    this.store.removeChip(chip);
  }

  protected clearAll() {
    this.store.clearFilters();
  }

  protected onPageSize(event: Event) {
    this.store.setLimit(Number((event.target as HTMLSelectElement).value));
  }

  protected openRecord(row: Customer) {
    this.composing.set(false);
    this.selected.set(row);
  }

  protected openCompose() {
    this.selected.set(null);
    this.composeType.set(this.store.recordType() || this.store.recordTypes().find((type) => type.active)?.code || '');
    this.composing.set(true);
  }

  protected onCreate(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const data = new FormData(form);
    const attributes: Record<string, unknown> = {};
    const recordType = String(data.get('__recordType') ?? this.composeType()).trim();
    for (const [key, value] of data.entries()) {
      if (key === '__recordType') continue;
      if (typeof value === 'string' && value.trim()) {
        attributes[key] = value.trim();
      }
    }
    if (!recordType) return;
    void this.store.create(recordType, attributes).then((ok) => {
      if (ok) {
        form.reset();
        this.composing.set(false);
      }
    });
  }
}
