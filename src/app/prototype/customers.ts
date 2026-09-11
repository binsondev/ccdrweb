import { Component, computed, signal } from '@angular/core';
import { protoCustomers, type ProtoCustomer } from './mock';

@Component({
  selector: 'ccdr-proto-customers',
  template: `
    <div class="proto-toolbar">
      <label class="proto-search">
        <span class="sr-only">Search customers</span>
        <input
          type="search"
          placeholder="Search any value — name, MRN, phone…"
          [value]="query()"
          (input)="onQuery($event)"
        />
      </label>
      <div class="flex flex-wrap gap-2">
        @for (chip of chips; track chip) {
          <button
            type="button"
            class="proto-chip"
            [class.proto-chip-on]="ward() === chip"
            (click)="ward.set(ward() === chip ? '' : chip)"
          >
            {{ chip }}
          </button>
        }
        <button type="button" class="proto-primary-btn" (click)="composing.set(true)">New record</button>
      </div>
    </div>

    <p class="mb-3 text-[12px] tracking-wide text-[color:var(--proto-muted)] uppercase">
      {{ rows().length }} records · filterable ward
    </p>

    <div class="proto-table-wrap">
      <table class="proto-table">
        <thead>
          <tr>
            <th>MRN</th>
            <th>Name</th>
            <th>Phone</th>
            <th>Ward</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          @for (row of rows(); track row.id) {
            <tr [class.proto-row-on]="selected()?.id === row.id" (click)="selected.set(row)">
              <td class="font-mono text-[12px]">{{ row.mrn }}</td>
              <td class="font-medium">{{ row.name }}</td>
              <td>{{ row.phone }}</td>
              <td>{{ row.ward }}</td>
              <td class="text-[color:var(--proto-muted)]">{{ row.updated }}</td>
            </tr>
          }
        </tbody>
      </table>
    </div>

    @if (selected(); as row) {
      <aside class="proto-drawer" role="dialog" [attr.aria-label]="'Record ' + row.mrn">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="proto-kicker">Record bag</p>
            <h2 class="font-serif text-2xl">{{ row.name }}</h2>
            <p class="font-mono text-xs text-[color:var(--proto-muted)]">{{ row.mrn }}</p>
          </div>
          <button type="button" class="proto-ghost-btn" (click)="selected.set(null)">Close</button>
        </div>
        <dl class="proto-dl">
          <div><dt>Date of birth</dt><dd>{{ row.dob }}</dd></div>
          <div><dt>Phone</dt><dd>{{ row.phone }}</dd></div>
          <div><dt>Ward</dt><dd>{{ row.ward }}</dd></div>
          <div><dt>Match key</dt><dd>mrn</dd></div>
        </dl>
        <p class="text-[12px] leading-relaxed text-[color:var(--proto-muted)]">
          Values live as a bag of attribute codes. Saving with the
          same MRN updates this record instead of inserting a duplicate.
        </p>
      </aside>
    }

    @if (composing()) {
      <aside class="proto-drawer" role="dialog" aria-label="New customer">
        <div class="flex items-start justify-between">
          <div>
            <p class="proto-kicker">Create or update</p>
            <h2 class="font-serif text-2xl">New record</h2>
          </div>
          <button type="button" class="proto-ghost-btn" (click)="composing.set(false)">Close</button>
        </div>
        <form class="mt-4 grid gap-3" (submit)="composing.set(false)">
          <label class="proto-field">MRN<input value="AH-" /></label>
          <label class="proto-field">Full name<input /></label>
          <label class="proto-field">Phone<input /></label>
          <label class="proto-field">Ward<input value="Cardiology" /></label>
          <button type="submit" class="proto-primary-btn mt-2">Save bag</button>
        </form>
      </aside>
    }
  `,
})
export class PrototypeCustomers {
  protected readonly query = signal('');
  protected readonly ward = signal('');
  protected readonly selected = signal<ProtoCustomer | null>(null);
  protected readonly composing = signal(false);
  protected readonly chips = ['Cardiology', 'Oncology', 'Maternity', 'Orthopedics'];

  protected onQuery(event: Event) {
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected readonly rows = computed(() => {
    const q = this.query().trim().toLowerCase();
    const ward = this.ward();
    return protoCustomers.filter((row) => {
      const hay = `${row.mrn} ${row.name} ${row.phone} ${row.ward}`.toLowerCase();
      return (!q || hay.includes(q)) && (!ward || row.ward === ward);
    });
  });
}
