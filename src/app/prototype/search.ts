import { Component, computed, signal } from '@angular/core';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmCheckbox } from '@spartan-ng/helm/checkbox';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmSeparator } from '@spartan-ng/helm/separator';
import { HlmTableImports } from '@spartan-ng/helm/table';
import {
  protoFilterable,
  protoSearchRows,
  type ProtoFilterable,
  type ProtoSearchRow,
} from './mock';

type TextDraft = { op: string; value: string };

@Component({
  selector: 'ccdr-proto-search',
  imports: [
    HlmBadge,
    HlmButton,
    HlmCheckbox,
    HlmInput,
    HlmLabel,
    HlmSeparator,
    ...HlmCardImports,
    ...HlmTableImports,
  ],
  template: `
    <div class="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start">
      <button
        hlmBtn
        variant="outline"
        size="sm"
        class="w-fit lg:hidden"
        type="button"
        (click)="panelOpen.set(!panelOpen())"
      >
        {{ panelOpen() ? 'Hide filters' : 'Show filters' }}
      </button>

      <aside class="lg:sticky lg:top-4 lg:block" [class.hidden]="!panelOpen()">
        <section hlmCard size="sm">
          <div hlmCardHeader class="border-border border-b">
            <div class="flex items-center justify-between gap-2">
              <h2 hlmCardTitle>Filters</h2>
              @if (chips().length) {
                <button hlmBtn variant="ghost" size="xs" type="button" (click)="clearAll()">
                  Clear all
                </button>
              }
            </div>
            <p hlmCardDescription>
              Built from GET /api/customers/filterable-attributes. Only active, filterable catalog
              fields appear.
            </p>
          </div>
          <div hlmCardContent class="grid gap-5 py-4">
            @for (group of groups; track group) {
              <section>
                <h3 class="text-muted-foreground mb-3 text-[10px] font-semibold tracking-[0.16em] uppercase">
                  {{ group }}
                </h3>
                <div class="grid gap-4">
                  @for (attr of inGroup(group); track attr.code) {
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
                                (click)="setBool(attr.code, choice.value)"
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
                              (input)="setMin(attr.code, $event)"
                              placeholder="Min"
                            />
                            <span class="text-muted-foreground text-xs">to</span>
                            <input
                              hlmInput
                              type="number"
                              [value]="maxValue(attr.code)"
                              (input)="setMax(attr.code, $event)"
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
                              (input)="setMin(attr.code, $event)"
                              placeholder="Min"
                            />
                            <span class="text-muted-foreground text-xs">to</span>
                            <input
                              hlmInput
                              type="number"
                              step="0.01"
                              [value]="maxValue(attr.code)"
                              (input)="setMax(attr.code, $event)"
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
                              (input)="setMin(attr.code, $event)"
                            />
                            <input
                              hlmInput
                              type="date"
                              [value]="maxValue(attr.code)"
                              (input)="setMax(attr.code, $event)"
                            />
                          </div>
                        }
                        @case ('DateTime') {
                          <div class="grid grid-cols-1 gap-2">
                            <input
                              hlmInput
                              type="datetime-local"
                              [value]="minValue(attr.code)"
                              (input)="setMin(attr.code, $event)"
                            />
                            <input
                              hlmInput
                              type="datetime-local"
                              [value]="maxValue(attr.code)"
                              (input)="setMax(attr.code, $event)"
                            />
                          </div>
                        }
                        @default {
                          <div class="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-2">
                            <select
                              hlmInput
                              [value]="textDraft(attr).op"
                              (change)="setTextOp(attr.code, $event)"
                            >
                              @for (op of attr.operators; track op) {
                                <option [value]="op">{{ opLabel(op) }}</option>
                              }
                            </select>
                            <input
                              hlmInput
                              type="search"
                              [value]="textDraft(attr).value"
                              (input)="setTextValue(attr.code, attr.operators[0], $event)"
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
          [value]="q()"
          (input)="onQuery($event)"
        />

        @if (chips().length) {
          <div class="flex flex-wrap gap-1.5">
            @for (chip of chips(); track chip.id) {
              <button hlmBtn variant="secondary" size="xs" type="button" (click)="removeChip(chip)">
                {{ chip.label }}
                <span aria-hidden="true">×</span>
              </button>
            }
          </div>
        }

        <div class="flex flex-wrap items-center justify-between gap-2">
          <p class="text-muted-foreground text-[11px] font-medium tracking-[0.14em] uppercase">
            {{ rows().length }} of {{ catalog.length }} records
          </p>
          <span hlmBadge variant="outline">AND across filters</span>
        </div>

        <pre
          class="bg-muted text-muted-foreground overflow-x-auto rounded-md border border-dashed p-3 font-mono text-[11px] leading-relaxed break-all whitespace-pre-wrap"
          tabindex="0"
        >{{ queryPreview() }}</pre>

        <section hlmCard>
          <div hlmCardContent class="p-0">
            <div hlmTableContainer>
              <table hlmTable>
                <thead hlmTHead>
                  <tr hlmTr>
                    <th hlmTh>MRN</th>
                    <th hlmTh>Name</th>
                    <th hlmTh>Ward</th>
                    <th hlmTh>Age</th>
                    <th hlmTh>Insured</th>
                    <th hlmTh>Blood</th>
                  </tr>
                </thead>
                <tbody hlmTBody>
                  @if (!rows().length) {
                    <tr hlmTr>
                      <td hlmTd colspan="6" class="text-muted-foreground">
                        No records match these filters. Clear a chip or widen the range.
                      </td>
                    </tr>
                  } @else {
                    @for (row of rows(); track row.id) {
                      <tr hlmTr>
                        <td hlmTd class="font-mono text-xs">{{ row.attributes['mrn'] }}</td>
                        <td hlmTd class="font-medium">{{ row.attributes['full_name'] }}</td>
                        <td hlmTd>{{ row.attributes['ward'] }}</td>
                        <td hlmTd>{{ row.attributes['age'] }}</td>
                        <td hlmTd>{{ row.attributes['insured'] === 'true' ? 'Yes' : 'No' }}</td>
                        <td hlmTd>{{ row.attributes['blood_group'] }}</td>
                      </tr>
                    }
                  }
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </section>
    </div>
  `,
})
export class PrototypeSearch {
  protected readonly catalog = protoSearchRows;
  protected readonly facets = protoFilterable;
  protected readonly groups = ['Identity', 'Contact', 'Stay', 'Clinical'];
  protected readonly boolChoices = [
    { value: '', label: 'Any' },
    { value: 'true', label: 'Yes' },
    { value: 'false', label: 'No' },
  ];

  protected readonly q = signal('');
  protected readonly panelOpen = signal(true);
  protected readonly text = signal<Record<string, TextDraft>>({});
  protected readonly options = signal<Record<string, string[]>>({});
  protected readonly min = signal<Record<string, string>>({});
  protected readonly max = signal<Record<string, string>>({});
  protected readonly bools = signal<Record<string, string>>({});

  protected readonly chips = computed(() => {
    const items: { id: string; kind: string; code: string; extra?: string; label: string }[] = [];
    for (const attr of this.facets) {
      const text = this.text()[attr.code];
      if (text?.value.trim()) {
        items.push({
          id: `text:${attr.code}`,
          kind: 'text',
          code: attr.code,
          label: `${attr.label} ${this.opLabel(text.op)} “${text.value.trim()}”`,
        });
      }
      for (const value of this.options()[attr.code] ?? []) {
        items.push({
          id: `opt:${attr.code}:${value}`,
          kind: 'opt',
          code: attr.code,
          extra: value,
          label: `${attr.label}: ${value}`,
        });
      }
      const min = this.min()[attr.code];
      if (min) {
        items.push({
          id: `min:${attr.code}`,
          kind: 'min',
          code: attr.code,
          label: `${attr.label} ≥ ${min}`,
        });
      }
      const max = this.max()[attr.code];
      if (max) {
        items.push({
          id: `max:${attr.code}`,
          kind: 'max',
          code: attr.code,
          label: `${attr.label} ≤ ${max}`,
        });
      }
      const bool = this.bools()[attr.code];
      if (bool) {
        items.push({
          id: `bool:${attr.code}`,
          kind: 'bool',
          code: attr.code,
          label: `${attr.label}: ${bool === 'true' ? 'Yes' : 'No'}`,
        });
      }
    }
    return items;
  });

  protected readonly queryPreview = computed(() => {
    const params: string[] = [];
    if (this.q().trim()) params.push(`q=${encodeURIComponent(this.q().trim())}`);
    for (const attr of this.facets) {
      const text = this.text()[attr.code];
      if (text?.value.trim()) {
        params.push(`filter=${attr.code}:${text.op}:${encodeURIComponent(text.value.trim())}`);
      }
      for (const value of this.options()[attr.code] ?? []) {
        params.push(`filter=${attr.code}:eq:${encodeURIComponent(value)}`);
      }
      if (this.min()[attr.code]) params.push(`filter=${attr.code}:gte:${this.min()[attr.code]}`);
      if (this.max()[attr.code]) params.push(`filter=${attr.code}:lte:${this.max()[attr.code]}`);
      if (this.bools()[attr.code]) params.push(`filter=${attr.code}:eq:${this.bools()[attr.code]}`);
    }
    const qs = params.length ? `?${params.join('&')}` : '';
    return `GET /api/customers${qs || '\n(no filters — list all in tenant)'}`;
  });

  protected readonly rows = computed(() => {
    const q = this.q().trim().toLowerCase();
    return this.catalog.filter((row) => this.matches(row, q));
  });

  protected inGroup(group: string) {
    return this.facets.filter((attr) => attr.group === group);
  }

  protected opLabel(op: string) {
    switch (op) {
      case 'contains':
        return 'contains';
      case 'eq':
        return 'is';
      case 'gt':
        return '>';
      case 'gte':
        return '≥';
      case 'lt':
        return '<';
      case 'lte':
        return '≤';
      default:
        return op;
    }
  }

  protected textDraft(attr: ProtoFilterable): TextDraft {
    return this.text()[attr.code] ?? { op: attr.operators[0] ?? 'eq', value: '' };
  }

  protected selectedOptions(code: string) {
    return this.options()[code] ?? [];
  }

  protected minValue(code: string) {
    return this.min()[code] ?? '';
  }

  protected maxValue(code: string) {
    return this.max()[code] ?? '';
  }

  protected boolValue(code: string) {
    return this.bools()[code] ?? '';
  }

  protected onQuery(event: Event) {
    this.q.set((event.target as HTMLInputElement).value);
  }

  protected setTextOp(code: string, event: Event) {
    const op = (event.target as HTMLSelectElement).value;
    this.text.update((current) => ({
      ...current,
      [code]: { op, value: current[code]?.value ?? '' },
    }));
  }

  protected setTextValue(code: string, fallbackOp: string, event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.text.update((current) => ({
      ...current,
      [code]: { op: current[code]?.op ?? fallbackOp, value },
    }));
  }

  protected onOption(code: string, value: string, checked: boolean) {
    this.options.update((current) => {
      const next = new Set(current[code] ?? []);
      if (checked) next.add(value);
      else next.delete(value);
      return { ...current, [code]: [...next] };
    });
  }

  protected toggleOption(code: string, value: string) {
    this.options.update((current) => {
      const next = new Set(current[code] ?? []);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return { ...current, [code]: [...next] };
    });
  }

  protected setMin(code: string, event: Event) {
    this.min.update((current) => ({ ...current, [code]: (event.target as HTMLInputElement).value }));
  }

  protected setMax(code: string, event: Event) {
    this.max.update((current) => ({ ...current, [code]: (event.target as HTMLInputElement).value }));
  }

  protected setBool(code: string, value: string) {
    this.bools.update((current) => ({ ...current, [code]: value }));
  }

  protected removeChip(chip: { kind: string; code: string; extra?: string }) {
    if (chip.kind === 'text') {
      this.text.update((current) => ({
        ...current,
        [chip.code]: { op: current[chip.code]?.op ?? 'contains', value: '' },
      }));
    }
    if (chip.kind === 'opt' && chip.extra) this.toggleOption(chip.code, chip.extra);
    if (chip.kind === 'min') this.min.update((current) => ({ ...current, [chip.code]: '' }));
    if (chip.kind === 'max') this.max.update((current) => ({ ...current, [chip.code]: '' }));
    if (chip.kind === 'bool') this.setBool(chip.code, '');
  }

  protected clearAll() {
    this.q.set('');
    this.text.set({});
    this.options.set({});
    this.min.set({});
    this.max.set({});
    this.bools.set({});
  }

  private matches(row: ProtoSearchRow, q: string) {
    const bag = Object.values(row.attributes).join(' ').toLowerCase();
    if (q && !bag.includes(q)) return false;

    for (const attr of this.facets) {
      const raw = row.attributes[attr.code] ?? '';
      const text = this.text()[attr.code];
      if (text?.value.trim()) {
        const needle = text.value.trim().toLowerCase();
        const hay = raw.toLowerCase();
        if (text.op === 'eq' ? hay !== needle : !hay.includes(needle)) return false;
      }
      const selected = this.options()[attr.code] ?? [];
      if (selected.length && !selected.includes(raw)) return false;
      if (this.min()[attr.code] && compare(raw, this.min()[attr.code], attr.dataType) < 0) return false;
      if (this.max()[attr.code] && compare(raw, this.max()[attr.code], attr.dataType) > 0) return false;
      const bool = this.bools()[attr.code];
      if (bool && raw !== bool) return false;
    }
    return true;
  }
}

function compare(left: string, right: string, type: string) {
  if (type === 'Integer' || type === 'Decimal') {
    return Number(left) - Number(right);
  }
  return left.localeCompare(right);
}
