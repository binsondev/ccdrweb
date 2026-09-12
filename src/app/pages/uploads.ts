import { Component, computed, effect, inject } from '@angular/core';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { AuthStore } from '../core/auth.store';
import { UploadsStore } from '../core/uploads.store';
import { StatusBanner } from '../shared/status-banner';

@Component({
  selector: 'ccdr-uploads',
  imports: [HlmBadge, HlmButton, HlmInput, StatusBanner, ...HlmCardImports, ...HlmTableImports],
  template: `
    <div class="grid gap-6">
      <ccdr-status [error]="store.error()" [notice]="store.notice()" />

      <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <section hlmCard>
          <div hlmCardHeader class="border-border border-b">
            <h2 hlmCardTitle>New workbook</h2>
            <p hlmCardDescription>Upload against an activated mapping. Staging never writes customers.</p>
          </div>
          <div hlmCardContent>
            <form class="grid gap-3" (submit)="onUpload($event)">
              <select hlmInput name="mappingProfileId" required>
                <option value="">Activated mapping</option>
                @for (profile of activated(); track profile.id) {
                  <option [value]="profile.id">
                    {{ profile.name }} · {{ profile.recordType }} (v{{ profile.current.versionNumber }})
                  </option>
                }
              </select>
              <input hlmInput type="file" name="file" accept=".xlsx" required />
              <button hlmBtn class="w-fit" type="submit" [disabled]="store.saving()">
                {{ store.saving() ? 'Uploading…' : 'Stage workbook' }}
              </button>
            </form>
          </div>
        </section>

        @if (latestStaged(); as batch) {
          <aside hlmCard>
            <div hlmCardHeader>
              <p hlmCardDescription>{{ batch.fileName }}</p>
              <h2 class="text-3xl font-semibold tracking-tight">{{ batch.totalRows }}</h2>
              <p class="text-muted-foreground text-sm">
                rows staged · {{ batch.mappingProfileName }} v{{ batch.mappingVersionNumber }}
              </p>
            </div>
            <div hlmCardContent class="grid gap-4">
              <dl class="grid grid-cols-3 gap-3 text-center">
                <div class="bg-muted rounded-md px-2 py-3">
                  <dt class="text-muted-foreground text-[10px] tracking-[0.12em] uppercase">Valid</dt>
                  <dd class="text-lg font-semibold">{{ batch.validRows }}</dd>
                </div>
                <div class="bg-muted rounded-md px-2 py-3">
                  <dt class="text-muted-foreground text-[10px] tracking-[0.12em] uppercase">Invalid</dt>
                  <dd class="text-lg font-semibold">{{ batch.invalidRows }}</dd>
                </div>
                <div class="bg-muted rounded-md px-2 py-3">
                  <dt class="text-muted-foreground text-[10px] tracking-[0.12em] uppercase">Review</dt>
                  <dd class="text-lg font-semibold">{{ batch.reviewRows }}</dd>
                </div>
              </dl>
              @if (batch.missingHeaders.length) {
                <p class="text-destructive text-xs">
                  Mapping looks for {{ batch.missingHeaders.join(', ') }}, which is not in this
                  workbook. The mapper matches the Excel header text, not the attribute code.
                </p>
              }
              @if (batch.ignoredHeaders.length) {
                <p class="text-muted-foreground text-xs">
                  Unused columns in the file: {{ batch.ignoredHeaders.join(', ') }}.
                </p>
              }
              <p class="text-muted-foreground text-xs">Policy: {{ batch.commitPolicy }}.</p>
              <button hlmBtn type="button" [disabled]="!batch.validRows" (click)="store.commit(batch.id)">
                Commit {{ batch.validRows }} records
              </button>
              <button hlmBtn variant="ghost" type="button" (click)="store.cancel(batch.id)">Cancel</button>
            </div>
          </aside>
        }
      </div>

      @if (store.stagedRows().length) {
        <section hlmCard>
          <div hlmCardHeader class="border-border border-b">
            <h2 hlmCardTitle>Staged rows</h2>
            <p hlmCardDescription>First rows from the latest staged workbook, including why a row failed.</p>
          </div>
          <div hlmCardContent class="p-0">
            <div hlmTableContainer>
              <table hlmTable>
                <thead hlmTHead>
                  <tr hlmTr>
                    <th hlmTh>Excel row</th>
                    <th hlmTh>Status</th>
                    <th hlmTh>Values</th>
                    <th hlmTh>Errors</th>
                  </tr>
                </thead>
                <tbody hlmTBody>
                  @for (row of store.stagedRows(); track row.id) {
                    <tr hlmTr>
                      <td hlmTd>{{ row.excelRow }}</td>
                      <td hlmTd>
                        <span hlmBadge [variant]="row.status === 'Valid' ? 'default' : 'destructive'">
                          {{ row.status }}
                        </span>
                      </td>
                      <td hlmTd class="text-xs">
                        {{ valueSummary(row.values) }}
                      </td>
                      <td hlmTd class="text-destructive text-xs">
                        {{ row.errors.map((error) => error.message).join(' ') || '—' }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </section>
      }

      <section hlmCard>
        <div hlmCardHeader class="border-border border-b">
          <h2 hlmCardTitle>Batches</h2>
        </div>
        <div hlmCardContent class="p-0">
          @if (store.loading()) {
            <p class="text-muted-foreground px-4 py-6 text-sm">Loading batches…</p>
          } @else if (!store.batches().length) {
            <p class="text-muted-foreground px-4 py-6 text-sm">No upload jobs yet.</p>
          } @else {
            <div hlmTableContainer>
              <table hlmTable>
                <thead hlmTHead>
                  <tr hlmTr>
                    <th hlmTh>File</th>
                    <th hlmTh>Status</th>
                    <th hlmTh>Rows</th>
                    <th hlmTh>Valid / invalid</th>
                    <th hlmTh></th>
                  </tr>
                </thead>
                <tbody hlmTBody>
                  @for (batch of store.batches(); track batch.id) {
                    <tr hlmTr>
                      <td hlmTd>{{ batch.fileName }}</td>
                      <td hlmTd>
                        <span hlmBadge variant="outline">{{ batch.status }}</span>
                      </td>
                      <td hlmTd>{{ batch.totalRows }}</td>
                      <td hlmTd>{{ batch.validRows }} / {{ batch.invalidRows }}</td>
                      <td hlmTd>
                        <div class="flex gap-2">
                          @if (batch.status === 'Staged') {
                            <button hlmBtn size="sm" type="button" (click)="store.commit(batch.id)">
                              Commit
                            </button>
                            <button hlmBtn variant="ghost" size="sm" type="button" (click)="store.cancel(batch.id)">
                              Cancel
                            </button>
                          }
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      </section>
    </div>
  `,
})
export class UploadsPage {
  protected readonly auth = inject(AuthStore);
  protected readonly store = inject(UploadsStore);
  protected readonly activated = computed(() =>
    this.store.profiles().filter((profile) => profile.current?.activated),
  );
  protected readonly latestStaged = computed(() => {
    const latest = this.store.batches()[0];
    return latest?.status === 'Staged' ? latest : null;
  });

  constructor() {
    effect(() => {
      if (this.auth.tenantSlug()) {
        void this.store.load();
      }
    });
  }

  protected onUpload(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const data = new FormData(form);
    const mappingProfileId = String(data.get('mappingProfileId') ?? '');
    const file = data.get('file');
    if (!mappingProfileId || !(file instanceof File) || !file.size) {
      return;
    }
    void this.store.upload(mappingProfileId, file).then(() => form.reset());
  }

  protected valueSummary(values: Record<string, unknown>) {
    return Object.entries(values)
      .map(([key, value]) => `${key}=${value == null || value === '' ? '∅' : value}`)
      .join(' · ');
  }
}
