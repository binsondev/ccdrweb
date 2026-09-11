import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { protoCustomers, type ProtoCustomer } from './mock';

@Component({
  selector: 'ccdr-proto-customers',
  imports: [RouterLink, HlmButton, HlmInput, ...HlmCardImports, ...HlmTableImports],
  template: `
    <div class="grid gap-4">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
        <input
          hlmInput
          type="search"
          class="lg:max-w-sm"
          placeholder="Search any value — name, MRN, phone…"
          [value]="query()"
          (input)="onQuery($event)"
        />
        <div class="flex flex-wrap items-center gap-1.5">
          @for (chip of chips; track chip) {
            <button
              hlmBtn
              size="xs"
              type="button"
              [variant]="ward() === chip ? 'default' : 'outline'"
              (click)="ward.set(ward() === chip ? '' : chip)"
            >
              {{ chip }}
            </button>
          }
        </div>
        <div class="flex flex-wrap gap-2 lg:ml-auto">
          <a hlmBtn variant="outline" size="sm" routerLink="/prototype/search">Faceted search</a>
          <button hlmBtn size="sm" type="button" (click)="openCompose()">New record</button>
        </div>
      </div>

      <p class="text-muted-foreground text-[11px] font-medium tracking-[0.14em] uppercase">
        {{ rows().length }} records · filterable ward
      </p>

      <section hlmCard>
        <div hlmCardContent class="p-0">
          <div hlmTableContainer>
            <table hlmTable>
              <thead hlmTHead>
                <tr hlmTr>
                  <th hlmTh>MRN</th>
                  <th hlmTh>Name</th>
                  <th hlmTh>Phone</th>
                  <th hlmTh>Ward</th>
                  <th hlmTh>Updated</th>
                </tr>
              </thead>
              <tbody hlmTBody>
                @if (!rows().length) {
                  <tr hlmTr>
                    <td hlmTd colspan="5" class="text-muted-foreground">
                      No customers match this search.
                    </td>
                  </tr>
                } @else {
                  @for (row of rows(); track row.id) {
                    <tr
                      hlmTr
                      class="hover:bg-muted/50 cursor-pointer"
                      [class.bg-muted]="selected()?.id === row.id"
                      (click)="openRecord(row)"
                    >
                      <td hlmTd class="font-mono text-xs">{{ row.mrn }}</td>
                      <td hlmTd class="font-medium">{{ row.name }}</td>
                      <td hlmTd>{{ row.phone }}</td>
                      <td hlmTd>{{ row.ward }}</td>
                      <td hlmTd class="text-muted-foreground">{{ row.updated }}</td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>

    @if (selected(); as row) {
      <div class="fixed inset-0 z-40 bg-foreground/25" (click)="selected.set(null)"></div>
      <aside
        class="bg-card text-card-foreground border-border fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l shadow-lg"
        role="dialog"
        [attr.aria-label]="'Record ' + row.mrn"
        (click)="$event.stopPropagation()"
      >
        <div class="flex items-start justify-between gap-4 px-6 py-5">
          <div>
            <p class="text-muted-foreground text-[11px] font-medium tracking-[0.16em] uppercase">
              Record bag
            </p>
            <h2 class="text-xl font-semibold tracking-tight">{{ row.name }}</h2>
            <p class="text-muted-foreground font-mono text-xs">{{ row.mrn }}</p>
          </div>
          <button hlmBtn variant="ghost" size="sm" type="button" (click)="selected.set(null)">
            Close
          </button>
        </div>
        <dl class="grid gap-4 px-6">
          <div>
            <dt class="text-muted-foreground text-[11px] tracking-[0.12em] uppercase">Date of birth</dt>
            <dd>{{ row.dob }}</dd>
          </div>
          <div>
            <dt class="text-muted-foreground text-[11px] tracking-[0.12em] uppercase">Phone</dt>
            <dd>{{ row.phone }}</dd>
          </div>
          <div>
            <dt class="text-muted-foreground text-[11px] tracking-[0.12em] uppercase">Ward</dt>
            <dd>{{ row.ward }}</dd>
          </div>
          <div>
            <dt class="text-muted-foreground text-[11px] tracking-[0.12em] uppercase">Match key</dt>
            <dd class="font-mono text-sm">mrn</dd>
          </div>
        </dl>
        <p class="text-muted-foreground mt-auto px-6 py-6 text-xs leading-relaxed">
          Values live as a bag of attribute codes. Saving with the same MRN updates this record
          instead of inserting a duplicate.
        </p>
      </aside>
    }

    @if (composing()) {
      <div class="fixed inset-0 z-40 bg-foreground/25" (click)="composing.set(false)"></div>
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
        <form class="grid gap-3 px-6" (submit)="composing.set(false)">
          <label class="grid gap-1.5 text-sm font-medium">
            MRN
            <input hlmInput value="AH-" />
          </label>
          <label class="grid gap-1.5 text-sm font-medium">
            Full name
            <input hlmInput />
          </label>
          <label class="grid gap-1.5 text-sm font-medium">
            Phone
            <input hlmInput />
          </label>
          <label class="grid gap-1.5 text-sm font-medium">
            Ward
            <input hlmInput value="Cardiology" />
          </label>
          <button hlmBtn class="mt-2" type="submit">Save bag</button>
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

  protected openRecord(row: ProtoCustomer) {
    this.composing.set(false);
    this.selected.set(row);
  }

  protected openCompose() {
    this.selected.set(null);
    this.composing.set(true);
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
