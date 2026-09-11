import { Component, effect, inject, signal } from '@angular/core';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { AuthStore } from '../core/auth.store';
import { MappingsStore } from '../core/mappings.store';
import { StatusBanner } from '../shared/status-banner';

@Component({
  selector: 'ccdr-mappings',
  imports: [HlmBadge, HlmButton, HlmInput, StatusBanner, ...HlmCardImports, ...HlmTableImports],
  template: `
    <div class="grid gap-6">
      <header class="flex flex-col gap-1">
        <h1 class="text-2xl font-semibold tracking-tight">Excel mappings</h1>
        <p class="text-muted-foreground text-sm">
          Named column-to-attribute contracts. Extraction never guesses column order. Activate a
          version before uploading a workbook.
        </p>
      </header>

      <ccdr-status [error]="store.error()" [notice]="store.notice()" />

      <section hlmCard>
        <div hlmCardContent>
          @if (store.loading()) {
            <p class="text-muted-foreground text-sm">Loading mapping profiles…</p>
          } @else if (!store.profiles().length) {
            <p class="text-muted-foreground text-sm">No mapping profiles yet.</p>
          } @else {
            <div hlmTableContainer>
              <table hlmTable>
                <thead hlmTHead>
                  <tr hlmTr>
                    <th hlmTh>Name</th>
                    <th hlmTh>Version</th>
                    <th hlmTh>Bindings</th>
                    <th hlmTh>Status</th>
                    @if (auth.canCatalogWrite()) {
                      <th hlmTh></th>
                    }
                  </tr>
                </thead>
                <tbody hlmTBody>
                  @for (profile of store.profiles(); track profile.id) {
                    <tr hlmTr>
                      <td hlmTd>
                        {{ profile.name }}
                        @if (profile.isDefault) {
                          <span hlmBadge variant="secondary">Default</span>
                        }
                      </td>
                      <td hlmTd>v{{ profile.current.versionNumber }}</td>
                      <td hlmTd>{{ profile.current.bindings.length }}</td>
                      <td hlmTd>
                        @if (profile.current.activated) {
                          <span hlmBadge>Activated</span>
                        } @else {
                          <span hlmBadge variant="outline">Draft</span>
                        }
                      </td>
                      @if (auth.canCatalogWrite()) {
                        <td hlmTd>
                          @if (!profile.current.activated) {
                            <button hlmBtn variant="outline" size="sm" type="button" (click)="store.activate(profile.id)">
                              Activate
                            </button>
                          }
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
            <h2 hlmCardTitle>New profile</h2>
            <p hlmCardDescription>Map each Excel header to an attribute code.</p>
          </div>
          <div hlmCardContent>
            <form class="grid gap-3" (submit)="onCreate($event)">
              <label class="grid gap-1 text-sm">
                Name
                <input hlmInput name="name" required placeholder="Hospital intake v1" />
              </label>
              @for (row of bindings(); track $index) {
                <div class="grid gap-2 md:grid-cols-2">
                  <input
                    hlmInput
                    [value]="row.excelHeader"
                    (input)="updateBinding($index, 'excelHeader', $event)"
                    placeholder="Excel header"
                  />
                  <select
                    hlmInput
                    [value]="row.attributeCode"
                    (change)="updateBinding($index, 'attributeCode', $event)"
                  >
                    <option value="">Attribute</option>
                    @for (attr of store.attributes(); track attr.code) {
                      <option [value]="attr.code">{{ attr.label }} ({{ attr.code }})</option>
                    }
                  </select>
                </div>
              }
              <div class="flex flex-wrap gap-2">
                <button hlmBtn variant="outline" type="button" (click)="addBinding()">Add column</button>
                <button hlmBtn type="submit" [disabled]="store.saving()">
                  {{ store.saving() ? 'Saving…' : 'Create mapping' }}
                </button>
              </div>
            </form>
          </div>
        </section>
      }
    </div>
  `,
})
export class MappingsPage {
  protected readonly auth = inject(AuthStore);
  protected readonly store = inject(MappingsStore);
  protected readonly bindings = signal([{ excelHeader: '', attributeCode: '' }]);

  constructor() {
    effect(() => {
      if (this.auth.tenantSlug()) {
        void this.store.load();
      }
    });
  }

  protected addBinding() {
    this.bindings.update((rows) => [...rows, { excelHeader: '', attributeCode: '' }]);
  }

  protected updateBinding(index: number, key: 'excelHeader' | 'attributeCode', event: Event) {
    const value = (event.target as HTMLInputElement | HTMLSelectElement).value;
    this.bindings.update((rows) =>
      rows.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    );
  }

  protected onCreate(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const name = String(new FormData(form).get('name') ?? '').trim();
    const bindings = this.bindings().filter((row) => row.excelHeader && row.attributeCode);
    void this.store
      .create({
        name,
        headerRowIndex: 1,
        ignoreUnmappedColumns: true,
        isDefault: false,
        bindings: bindings.map((row) => ({ ...row, transforms: [] })),
      })
      .then(() => {
        form.reset();
        this.bindings.set([{ excelHeader: '', attributeCode: '' }]);
      });
  }
}
