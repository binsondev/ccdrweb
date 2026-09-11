import { Component, computed, signal } from '@angular/core';
import {
  protoFilterable,
  protoSearchRows,
  type ProtoFilterable,
  type ProtoSearchRow,
} from './mock';

type TextDraft = { op: string; value: string };

@Component({
  selector: 'ccdr-proto-search',
  template: `
    <div class="proto-shop">
      <button type="button" class="proto-ghost-btn proto-filters-toggle" (click)="panelOpen.set(!panelOpen())">
        {{ panelOpen() ? 'Hide filters' : 'Show filters' }}
      </button>

      <aside class="proto-facets" [class.proto-facets-open]="panelOpen()">
        <div class="flex items-center justify-between gap-2">
          <p class="proto-kicker" style="margin: 0">Filters</p>
          @if (chips().length) {
            <button type="button" class="proto-ghost-btn" (click)="clearAll()">Clear all</button>
          }
        </div>
        <p class="mt-1 mb-4 text-[12px] leading-relaxed text-[color:var(--proto-muted)]">
          Built from <code class="font-mono">GET /api/customers/filterable-attributes</code>.
          Only active, filterable catalog fields appear.
        </p>

        @for (group of groups; track group) {
          <section class="proto-facet">
            <h2>{{ group }}</h2>
            @for (attr of inGroup(group); track attr.code) {
              <div class="proto-facet-field">
                <p class="proto-facet-label">{{ attr.label }}</p>
                @switch (attr.dataType) {
                  @case ('Dropdown') {
                    <ul class="proto-option-list">
                      @for (opt of attr.options; track opt.value) {
                        <li>
                          <label>
                            <input
                              type="checkbox"
                              [checked]="selectedOptions(attr.code).includes(opt.value)"
                              (change)="toggleOption(attr.code, opt.value)"
                            />
                            {{ opt.label }}
                          </label>
                        </li>
                      }
                    </ul>
                  }
                  @case ('Boolean') {
                    <div class="proto-bool">
                      @for (choice of boolChoices; track choice.value) {
                        <label>
                          <input
                            type="radio"
                            [name]="'bool-' + attr.code"
                            [checked]="boolValue(attr.code) === choice.value"
                            (change)="setBool(attr.code, choice.value)"
                          />
                          {{ choice.label }}
                        </label>
                      }
                    </div>
                  }
                  @case ('Integer') {
                    <div class="proto-range">
                      <input
                        type="number"
                        [value]="minValue(attr.code)"
                        (input)="setMin(attr.code, $event)"
                        placeholder="Min"
                      />
                      <span>to</span>
                      <input
                        type="number"
                        [value]="maxValue(attr.code)"
                        (input)="setMax(attr.code, $event)"
                        placeholder="Max"
                      />
                    </div>
                  }
                  @case ('Decimal') {
                    <div class="proto-range">
                      <input
                        type="number"
                        step="0.01"
                        [value]="minValue(attr.code)"
                        (input)="setMin(attr.code, $event)"
                        placeholder="Min"
                      />
                      <span>to</span>
                      <input
                        type="number"
                        step="0.01"
                        [value]="maxValue(attr.code)"
                        (input)="setMax(attr.code, $event)"
                        placeholder="Max"
                      />
                    </div>
                  }
                  @case ('Date') {
                    <div class="proto-range proto-range-dates">
                      <input type="date" [value]="minValue(attr.code)" (input)="setMin(attr.code, $event)" />
                      <input type="date" [value]="maxValue(attr.code)" (input)="setMax(attr.code, $event)" />
                    </div>
                  }
                  @case ('DateTime') {
                    <div class="proto-range proto-range-dates">
                      <input type="datetime-local" [value]="minValue(attr.code)" (input)="setMin(attr.code, $event)" />
                      <input type="datetime-local" [value]="maxValue(attr.code)" (input)="setMax(attr.code, $event)" />
                    </div>
                  }
                  @default {
                    <div class="proto-text-filter">
                      <select [value]="textDraft(attr).op" (change)="setTextOp(attr.code, $event)">
                        @for (op of attr.operators; track op) {
                          <option [value]="op">{{ opLabel(op) }}</option>
                        }
                      </select>
                      <input
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
          </section>
        }
      </aside>

      <section>
        <label class="proto-search">
          <span class="sr-only">Keyword search</span>
          <input
            type="search"
            placeholder="Search any value across the bag…"
            [value]="q()"
            (input)="onQuery($event)"
          />
        </label>

        @if (chips().length) {
          <div class="proto-chip-row">
            @for (chip of chips(); track chip.id) {
              <button type="button" class="proto-chip proto-chip-on" (click)="removeChip(chip)">
                {{ chip.label }}
                <span aria-hidden="true">×</span>
              </button>
            }
          </div>
        }

        <p class="proto-result-meta">{{ rows().length }} of {{ catalog.length }} records</p>

        <pre class="proto-query" tabindex="0">{{ queryPreview() }}</pre>

        <div class="proto-table-wrap">
          <table class="proto-table">
            <thead>
              <tr>
                <th>MRN</th>
                <th>Name</th>
                <th>Ward</th>
                <th>Age</th>
                <th>Insured</th>
                <th>Blood</th>
              </tr>
            </thead>
            <tbody>
              @if (!rows().length) {
                <tr>
                  <td colspan="6">No records match these filters. Clear a chip or widen the range.</td>
                </tr>
              } @else {
                @for (row of rows(); track row.id) {
                  <tr>
                    <td class="font-mono text-[12px]">{{ row.attributes['mrn'] }}</td>
                    <td class="font-medium">{{ row.attributes['full_name'] }}</td>
                    <td>{{ row.attributes['ward'] }}</td>
                    <td>{{ row.attributes['age'] }}</td>
                    <td>{{ row.attributes['insured'] === 'true' ? 'Yes' : 'No' }}</td>
                    <td>{{ row.attributes['blood_group'] }}</td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
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
  protected readonly panelOpen = signal(false);
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
      this.text.update((current) => ({ ...current, [chip.code]: { op: current[chip.code]?.op ?? 'contains', value: '' } }));
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
