import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { Api, apiMessage } from './api';
import { MappingProfile, StagedRow, UploadBatch } from './models';

type UploadsState = {
  loading: boolean;
  saving: boolean;
  error: string | null;
  notice: string | null;
  batches: UploadBatch[];
  profiles: MappingProfile[];
  stagedRows: StagedRow[];
};

const initial: UploadsState = {
  loading: false,
  saving: false,
  error: null,
  notice: null,
  batches: [],
  profiles: [],
  stagedRows: [],
};

export const UploadsStore = signalStore(
  { providedIn: 'root' },
  withState(initial),
  withMethods((store, api = inject(Api)) => {
    const load = async () => {
      patchState(store, { loading: true, error: null });
      try {
        const [uploads, profiles] = await Promise.all([api.uploads(), api.mappingProfiles()]);
        const latest = uploads.batches[0];
        const staged = latest?.status === 'Staged' ? latest : undefined;
        const rows = staged ? (await api.stagedRows(staged.id, 20)).rows : [];
        patchState(store, {
          loading: false,
          batches: uploads.batches,
          profiles: profiles.profiles,
          stagedRows: rows,
        });
        return true;
      } catch (err) {
        patchState(store, { loading: false, error: apiMessage(err) });
        return false;
      }
    };

    return {
      load,
      async upload(mappingProfileId: string, file: File) {
        patchState(store, { saving: true, error: null, notice: null });
        try {
          let batch = await api.createUpload(mappingProfileId, file);
          for (let i = 0; i < 12 && (batch.status === 'Received' || batch.status === 'Parsing'); i++) {
            await new Promise((resolve) => setTimeout(resolve, 350));
            batch = await api.getUpload(batch.id);
          }
          patchState(store, {
            saving: false,
            notice:
              batch.missingHeaders.length
                ? `Staged ${file.name}. Mapping header '${batch.missingHeaders.join(', ')}' was not in the file.`
                : `Staged ${file.name}. ${batch.validRows} valid, ${batch.invalidRows} invalid.`,
          });
          return load();
        } catch (err) {
          patchState(store, { saving: false, error: apiMessage(err) });
          return false;
        }
      },
      async commit(id: string) {
        patchState(store, { error: null, notice: null });
        try {
          const batch = await api.commitUpload(id);
          patchState(store, {
            notice: `Commit ${batch.status}. Created ${batch.createdCount}, updated ${batch.updatedCount}.`,
          });
          return load();
        } catch (err) {
          patchState(store, { error: apiMessage(err) });
          return false;
        }
      },
      async cancel(id: string) {
        patchState(store, { error: null, notice: null });
        try {
          await api.cancelUpload(id);
          patchState(store, { notice: 'Upload cancelled.' });
          return load();
        } catch (err) {
          patchState(store, { error: apiMessage(err) });
          return false;
        }
      },
    };
  }),
);
