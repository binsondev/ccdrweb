import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { AuthStore } from '../core/auth.store';
import { MappingsStore } from '../core/mappings.store';
import { emptyBindingDraft, MappingBindingDraft } from '../core/models';
import { MappingBindingsEditor } from '../shared/mapping-bindings';
import { StatusBanner } from '../shared/status-banner';

@Component({
  selector: 'ccdr-mapping-overview',
  imports: [
    RouterLink,
    HlmBadge,
    HlmButton,
    StatusBanner,
    MappingBindingsEditor,
    ...HlmAlertImports,
    ...HlmCardImports,
    ...HlmTableImports,
  ],
  template: `
    <div class="grid gap-6">
      <div class="flex flex-wrap items-center gap-3">
        <a hlmBtn variant="outline" size="sm" routerLink="/app/mappings">Back to mappings</a>
        @if (profile(); as profile) {
          <button
            hlmBtn
            variant="secondary"
            size="sm"
            type="button"
            [disabled]="store.downloading() || !profile.current.bindings.length"
            (click)="store.downloadTemplate(profile.id)"
          >
            {{ store.downloading() ? 'Downloading…' : 'Download empty Excel' }}
          </button>
          @if (auth.canCatalogWrite()) {
            <button
              hlmBtn
              variant="outline"
              size="sm"
              type="button"
              [disabled]="store.saving()"
              (click)="copy(profile.id)"
            >
              Copy as new mapping
            </button>
            @if (!profile.current.activated) {
              <button hlmBtn size="sm" type="button" (click)="store.activate(profile.id)">Activate version</button>
            }
          }
        }
      </div>

      <ccdr-status [error]="store.error()" [notice]="store.notice()" />

      @if (store.detailLoading() && !profile()) {
        <p class="text-muted-foreground text-sm">Loading mapping…</p>
      } @else if (!profile()) {
        <p class="text-muted-foreground text-sm">This mapping profile was not found in the current tenant.</p>
      } @else {
        <section hlmCard>
          <div hlmCardHeader class="border-border border-b">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 hlmCardTitle>{{ profile()!.name }}</h2>
                <p hlmCardDescription>
                  Record type {{ profile()!.recordType }}.
                  {{ profile()!.description || 'This mapper cannot mix another type in the same Excel.' }}
                </p>
              </div>
              <div class="flex flex-wrap gap-1">
                @if (profile()!.isDefault) {
                  <span hlmBadge variant="secondary">Default</span>
                }
                @if (profile()!.current.activated) {
                  <span hlmBadge>Activated</span>
                } @else {
                  <span hlmBadge variant="outline">Draft</span>
                }
                @if (profile()!.current.immutable) {
                  <span hlmBadge variant="outline">Immutable</span>
                }
              </div>
            </div>
          </div>
          <div hlmCardContent class="grid gap-4 py-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p class="text-muted-foreground text-[11px] tracking-[0.12em] uppercase">Version</p>
              <p class="font-medium">v{{ profile()!.current.versionNumber }}</p>
            </div>
            <div>
              <p class="text-muted-foreground text-[11px] tracking-[0.12em] uppercase">Sheet</p>
              <p class="font-medium">{{ profile()!.current.sheetName || 'First sheet' }}</p>
            </div>
            <div>
              <p class="text-muted-foreground text-[11px] tracking-[0.12em] uppercase">Header row</p>
              <p class="font-medium">{{ profile()!.current.headerRowIndex }}</p>
            </div>
            <div>
              <p class="text-muted-foreground text-[11px] tracking-[0.12em] uppercase">Unmapped columns</p>
              <p class="font-medium">
                {{ profile()!.current.ignoreUnmappedColumns ? 'Ignored' : 'Must map' }}
              </p>
            </div>
          </div>
        </section>

        @if (profile()!.current.missingRequiredBindings.length) {
          <div hlmAlert variant="destructive">
            <p hlmAlertTitle>Missing required bindings</p>
            <p hlmAlertDescription>
              {{ profile()!.current.missingRequiredBindings.join(', ') }}
            </p>
          </div>
        }

        <section hlmCard>
          <div hlmCardHeader class="border-border border-b">
            <h2 hlmCardTitle>Column bindings</h2>
            <p hlmCardDescription>
              {{ profile()!.current.bindings.length }} Excel headers mapped to
              {{ profile()!.recordType }} attributes.
              @if (auth.canCatalogWrite()) {
                Saving an activated mapping creates a new draft version.
              } @else {
                Download an empty workbook with these headers to fill and upload.
              }
            </p>
          </div>
          @if (!profile()!.current.bindings.length) {
            <div hlmCardContent>
              <p class="text-muted-foreground py-2 text-sm">This version has no column bindings yet.</p>
            </div>
          } @else {
            <div hlmCardContent class="p-0">
              <div hlmTableContainer>
                <table hlmTable>
                  <thead hlmTHead>
                    <tr hlmTr>
                      <th hlmTh>Excel header</th>
                      <th hlmTh>Attribute</th>
                      <th hlmTh>Transforms</th>
                      <th hlmTh>Date format</th>
                    </tr>
                  </thead>
                  <tbody hlmTBody>
                    @for (bind of profile()!.current.bindings; track bind.excelHeader + ':' + bind.attributeCode) {
                      <tr hlmTr>
                        <td hlmTd>{{ bind.excelHeader }}</td>
                        <td hlmTd>
                          <span class="block">{{ attributeLabel(bind.attributeCode) }}</span>
                          <span class="text-muted-foreground font-mono text-xs">{{ bind.attributeCode }}</span>
                        </td>
                        <td hlmTd>
                          @if (bind.transforms.length) {
                            {{ bind.transforms.join(', ') }}
                          } @else {
                            <span class="text-muted-foreground">None</span>
                          }
                        </td>
                        <td hlmTd>
                          {{ bind.dateFormat || '—' }}
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }
          @if (auth.canCatalogWrite()) {
            <div hlmCardContent class="border-border grid gap-4 border-t py-4">
              <ccdr-mapping-bindings
                [bindings]="drafts()"
                [attributes]="typedAttributes()"
                (bindingsChange)="drafts.set($event)"
              />
              <button
                hlmBtn
                class="w-fit"
                type="button"
                [disabled]="store.saving()"
                (click)="save()"
              >
                {{ saveLabel() }}
              </button>
            </div>
          }
        </section>

        @if (store.versions().length) {
          <section hlmCard>
            <div hlmCardHeader class="border-border border-b">
              <h2 hlmCardTitle>Version history</h2>
              <p hlmCardDescription>Activated or committed versions cannot be rewritten.</p>
            </div>
            <div hlmCardContent class="p-0">
              <div hlmTableContainer>
                <table hlmTable>
                  <thead hlmTHead>
                    <tr hlmTr>
                      <th hlmTh>Version</th>
                      <th hlmTh>Bindings</th>
                      <th hlmTh>Status</th>
                      <th hlmTh>Created</th>
                    </tr>
                  </thead>
                  <tbody hlmTBody>
                    @for (version of store.versions(); track version.id) {
                      <tr hlmTr [class.bg-muted]="version.id === profile()!.current.id">
                        <td hlmTd>v{{ version.versionNumber }}</td>
                        <td hlmTd>{{ version.bindings.length }}</td>
                        <td hlmTd>
                          <div class="flex flex-wrap gap-1">
                            @if (version.id === profile()!.current.id) {
                              <span hlmBadge variant="secondary">Current</span>
                            }
                            @if (version.activated) {
                              <span hlmBadge>Activated</span>
                            }
                            @if (version.usedInCommit) {
                              <span hlmBadge variant="outline">Used in commit</span>
                            }
                          </div>
                        </td>
                        <td hlmTd class="text-muted-foreground">{{ version.createdAt.slice(0, 10) }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        }
      }
    </div>
  `,
})
export class MappingOverviewPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthStore);
  protected readonly store = inject(MappingsStore);
  protected readonly drafts = signal<MappingBindingDraft[]>([]);

  private readonly id = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id'))),
    { initialValue: this.route.snapshot.paramMap.get('id') },
  );

  protected readonly profile = computed(() => this.store.detail());
  protected readonly typedAttributes = computed(() => {
    const type = this.profile()?.recordType;
    const catalog = this.store.attributes();
    if (!type) return catalog;
    const scoped = catalog.filter((attr) => attr.recordType === type);
    return scoped.length ? scoped : catalog;
  });
  protected readonly saveLabel = computed(() => {
    if (this.store.saving()) return 'Saving…';
    return this.profile()?.current.immutable ? 'Save as new version' : 'Save bindings';
  });

  constructor() {
    effect(() => {
      const id = this.id();
      if (this.auth.tenantSlug() && id) {
        void this.store.loadDetail(id);
      }
    });
    effect(() => {
      const profile = this.profile();
      if (!profile) {
        this.drafts.set([]);
        return;
      }
      const rows = profile.current.bindings.map(
        (bind): MappingBindingDraft => ({
          excelHeader: bind.excelHeader,
          attributeCode: bind.attributeCode,
          transforms: [...bind.transforms],
          dateFormat: bind.dateFormat ?? '',
        }),
      );
      this.drafts.set(rows.length ? rows : [emptyBindingDraft()]);
    });
  }

  protected attributeLabel(code: string) {
    return this.typedAttributes().find((attr) => attr.code === code)?.label ?? code;
  }

  protected save() {
    const id = this.id();
    if (id) void this.store.saveBindings(id, this.drafts());
  }

  protected async copy(id: string) {
    const copied = await this.store.clone(id);
    if (copied) {
      void this.router.navigate(['/app/mappings', copied.id]);
    }
  }
}
