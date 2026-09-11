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
      <header class="flex flex-col gap-1">
        <h1 class="text-2xl font-semibold tracking-tight">Uploads</h1>
        <p class="text-muted-foreground text-sm">
          Stage an .xlsx against an activated mapping, then commit valid rows into this tenant’s
          customer store.
        </p>
      </header>

      <ccdr-status [error]="store.error()" [notice]="store.notice()" />

      <section hlmCard>
        <div hlmCardHeader>
          <h2 hlmCardTitle>New workbook</h2>
        </div>
        <div hlmCardContent>
          <form class="grid gap-3 md:grid-cols-[1fr_1fr_auto]" (submit)="onUpload($event)">
            <select hlmInput name="mappingProfileId" required>
              <option value="">Activated mapping</option>
              @for (profile of activated(); track profile.id) {
                <option [value]="profile.id">{{ profile.name }} (v{{ profile.current.versionNumber }})</option>
              }
            </select>
            <input hlmInput type="file" name="file" accept=".xlsx" required />
            <button hlmBtn type="submit" [disabled]="store.saving()">
              {{ store.saving() ? 'Uploading…' : 'Upload' }}
            </button>
          </form>
        </div>
      </section>

      <section hlmCard>
        <div hlmCardContent>
          @if (store.loading()) {
            <p class="text-muted-foreground text-sm">Loading batches…</p>
          } @else if (!store.batches().length) {
            <p class="text-muted-foreground text-sm">No upload jobs yet.</p>
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
}
