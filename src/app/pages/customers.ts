import { Component, computed, effect, inject } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { AuthStore } from '../core/auth.store';
import { CustomersStore } from '../core/customers.store';
import { displayValue } from '../core/format';
import { StatusBanner } from '../shared/status-banner';

@Component({
  selector: 'ccdr-customers',
  imports: [HlmButton, HlmInput, StatusBanner, ...HlmCardImports, ...HlmTableImports],
  template: `
    <div class="grid gap-6">
      <header class="flex flex-col gap-1">
        <h1 class="text-2xl font-semibold tracking-tight">Customers</h1>
        <p class="text-muted-foreground text-sm">
          Records are bags of tenant-defined attributes. Search any text value, or filter on
          attributes marked filterable.
        </p>
      </header>

      <ccdr-status [error]="store.error()" [notice]="store.notice()" />

      @if (store.matchKeyWarning()) {
        <p class="text-muted-foreground text-sm">{{ store.matchKeyWarning() }}</p>
      }

      <section hlmCard>
        <div hlmCardHeader>
          <h2 hlmCardTitle>Search</h2>
        </div>
        <div hlmCardContent>
          <form class="grid gap-3 md:grid-cols-4" (submit)="onSearch($event)">
            <input
              hlmInput
              type="search"
              placeholder="Any text value"
              [value]="store.q()"
              (input)="onQuery($event)"
            />
            <select
              hlmInput
              [value]="store.filterCode()"
              (change)="onFilterCode($event)"
            >
              <option value="">No attribute filter</option>
              @for (attr of store.filterable(); track attr.code) {
                <option [value]="attr.code">{{ attr.label }}</option>
              }
            </select>
            <select hlmInput [value]="store.filterOp()" (change)="onFilterOp($event)">
              @for (op of operators(); track op) {
                <option [value]="op">{{ op || 'equals' }}</option>
              }
            </select>
            <div class="flex gap-2">
              <input
                hlmInput
                [value]="store.filterValue()"
                (input)="onFilterValue($event)"
                placeholder="Value"
              />
              <button hlmBtn type="submit">Search</button>
            </div>
          </form>
        </div>
      </section>

      <section hlmCard>
        <div hlmCardHeader>
          <h2 hlmCardTitle>Results</h2>
          <p hlmCardDescription>{{ store.count() }} in this tenant</p>
        </div>
        <div hlmCardContent>
          @if (store.loading()) {
            <p class="text-muted-foreground text-sm">Loading customers…</p>
          } @else if (!store.customers().length) {
            <p class="text-muted-foreground text-sm">
              No customers match this search. Create a record or upload a workbook.
            </p>
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
                  @for (row of store.customers(); track row.id) {
                    <tr hlmTr>
                      @for (col of columns(); track col.code) {
                        <td hlmTd>{{ displayValue(row.attributes[col.code]) }}</td>
                      }
                      <td hlmTd>{{ row.updatedAt.slice(0, 10) }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      </section>

      @if (auth.canCustomerWrite()) {
        <section hlmCard>
          <div hlmCardHeader>
            <h2 hlmCardTitle>Create or update</h2>
            <p hlmCardDescription>
              Match-key attributes update an existing bag. Leave a field blank to omit it.
            </p>
          </div>
          <div hlmCardContent>
            <form class="grid gap-3 md:grid-cols-2" (submit)="onCreate($event)">
              @for (attr of store.attributes(); track attr.code) {
                @if (attr.active) {
                  <label class="grid gap-1 text-sm">
                    <span>
                      {{ attr.label }}
                      @if (attr.required) {
                        <span class="text-destructive">*</span>
                      }
                      @if (attr.matchKey) {
                        <span class="text-muted-foreground">(match key)</span>
                      }
                    </span>
                    <input hlmInput [name]="attr.code" [placeholder]="attr.code" />
                  </label>
                }
              }
              <div class="md:col-span-2">
                <button hlmBtn type="submit" [disabled]="store.saving()">
                  {{ store.saving() ? 'Saving…' : 'Save customer' }}
                </button>
              </div>
            </form>
          </div>
        </section>
      }
    </div>
  `,
})
export class CustomersPage {
  protected readonly auth = inject(AuthStore);
  protected readonly store = inject(CustomersStore);
  protected readonly displayValue = displayValue;

  protected readonly columns = computed(() => {
    const visible = this.store.attributes().filter((attr) => attr.active && attr.listVisible);
    return visible.length ? visible : this.store.attributes().filter((attr) => attr.active).slice(0, 4);
  });

  protected readonly operators = computed(() => {
    const code = this.store.filterCode();
    const attr = this.store.filterable().find((item) => item.code === code);
    return attr?.operators?.length ? attr.operators : [''];
  });

  constructor() {
    effect(() => {
      if (this.auth.tenantSlug()) {
        void this.store.load();
      }
    });
  }

  protected onQuery(event: Event) {
    this.store.setSearch((event.target as HTMLInputElement).value);
  }

  protected onFilterCode(event: Event) {
    const code = (event.target as HTMLSelectElement).value;
    const attr = this.store.filterable().find((item) => item.code === code);
    this.store.setFilter(code, attr?.operators[0] ?? '', this.store.filterValue());
  }

  protected onFilterOp(event: Event) {
    this.store.setFilter(
      this.store.filterCode(),
      (event.target as HTMLSelectElement).value,
      this.store.filterValue(),
    );
  }

  protected onFilterValue(event: Event) {
    this.store.setFilter(
      this.store.filterCode(),
      this.store.filterOp(),
      (event.target as HTMLInputElement).value,
    );
  }

  protected onSearch(event: Event) {
    event.preventDefault();
    void this.store.load();
  }

  protected onCreate(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const data = new FormData(form);
    const attributes: Record<string, unknown> = {};
    for (const [key, value] of data.entries()) {
      if (typeof value === 'string' && value.trim()) {
        attributes[key] = value.trim();
      }
    }
    void this.store.create(attributes).then(() => form.reset());
  }
}
