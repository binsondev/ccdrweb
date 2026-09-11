import { Component, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { AuthStore } from '../core/auth.store';
import { MappingsStore } from '../core/mappings.store';
import { emptyBindingDraft, MappingBindingDraft, MappingProfile } from '../core/models';
import { MappingBindingsEditor } from '../shared/mapping-bindings';
import { StatusBanner } from '../shared/status-banner';

@Component({
  selector: 'ccdr-mappings',
  imports: [
    HlmBadge,
    HlmButton,
    HlmInput,
    StatusBanner,
    MappingBindingsEditor,
    ...HlmCardImports,
    ...HlmTableImports,
  ],
  template: `
    <div class="grid gap-6">
      <ccdr-status [error]="store.error()" [notice]="store.notice()" />

      <section hlmCard>
        <div hlmCardHeader class="border-border border-b">
          <h2 hlmCardTitle>Profiles</h2>
          <p hlmCardDescription>Click a mapping to open its overview.</p>
        </div>
        <div hlmCardContent class="p-0">
          @if (store.loading()) {
            <p class="text-muted-foreground px-4 py-6 text-sm">Loading mapping profiles…</p>
          } @else if (!store.profiles().length) {
            <p class="text-muted-foreground px-4 py-6 text-sm">No mapping profiles yet.</p>
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
                    <tr
                      hlmTr
                      class="hover:bg-muted/50 cursor-pointer"
                      (click)="open(profile)"
                    >
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
                          <div class="flex flex-wrap gap-2">
                            <button
                              hlmBtn
                              variant="ghost"
                              size="sm"
                              type="button"
                              [disabled]="store.saving()"
                              (click)="copy($event, profile.id)"
                            >
                              Copy
                            </button>
                            @if (!profile.current.activated) {
                              <button
                                hlmBtn
                                variant="outline"
                                size="sm"
                                type="button"
                                (click)="activate($event, profile.id)"
                              >
                                Activate
                              </button>
                            }
                          </div>
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
            <p hlmCardDescription>
              Map each Excel header to an attribute. Choose transforms that should run on every cell
              in that column.
            </p>
          </div>
          <div hlmCardContent>
            <form class="grid gap-4" (submit)="onCreate($event)">
              <label class="grid max-w-md gap-1 text-sm">
                Name
                <input hlmInput name="name" required placeholder="Hospital intake v1" />
              </label>
              <ccdr-mapping-bindings
                [bindings]="bindings()"
                [attributes]="store.attributes()"
                (bindingsChange)="bindings.set($event)"
              />
              <button hlmBtn class="w-fit" type="submit" [disabled]="store.saving()">
                {{ store.saving() ? 'Saving…' : 'Create mapping' }}
              </button>
            </form>
          </div>
        </section>
      }
    </div>
  `,
})
export class MappingsPage {
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthStore);
  protected readonly store = inject(MappingsStore);
  protected readonly bindings = signal<MappingBindingDraft[]>([emptyBindingDraft()]);

  constructor() {
    effect(() => {
      if (this.auth.tenantSlug()) {
        void this.store.load();
      }
    });
  }

  protected open(profile: MappingProfile) {
    void this.router.navigate(['/app/mappings', profile.id]);
  }

  protected activate(event: Event, id: string) {
    event.stopPropagation();
    void this.store.activate(id);
  }

  protected async copy(event: Event, id: string) {
    event.stopPropagation();
    const copied = await this.store.clone(id);
    if (copied) {
      void this.router.navigate(['/app/mappings', copied.id]);
    }
  }

  protected onCreate(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const name = String(new FormData(form).get('name') ?? '').trim();
    const bindings = this.bindings()
      .filter((row) => row.excelHeader.trim() && row.attributeCode)
      .map((row) => ({
        excelHeader: row.excelHeader.trim(),
        attributeCode: row.attributeCode,
        transforms: row.transforms,
        dateFormat: row.dateFormat.trim() || null,
      }));
    void this.store
      .create({
        name,
        headerRowIndex: 1,
        ignoreUnmappedColumns: true,
        isDefault: false,
        bindings,
      })
      .then((ok) => {
        if (ok) {
          form.reset();
          this.bindings.set([emptyBindingDraft()]);
        }
      });
  }
}
