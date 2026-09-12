import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { Api, apiMessage } from './api';
import { RecordType } from './models';

type RecordTypesState = {
  loading: boolean;
  saving: boolean;
  error: string | null;
  notice: string | null;
  tenant: string;
  recordTypes: RecordType[];
};

const initial: RecordTypesState = {
  loading: false,
  saving: false,
  error: null,
  notice: null,
  tenant: '',
  recordTypes: [],
};

export const RecordTypesStore = signalStore(
  { providedIn: 'root' },
  withState(initial),
  withMethods((store, api = inject(Api)) => {
    const load = async () => {
      patchState(store, { loading: true, error: null });
      try {
        const response = await api.recordTypes();
        patchState(store, {
          loading: false,
          tenant: response.tenant,
          recordTypes: response.recordTypes,
        });
        return true;
      } catch (err) {
        patchState(store, { loading: false, error: apiMessage(err) });
        return false;
      }
    };

    return {
      load,
      async create(body: { code: string; label: string; description?: string | null }) {
        patchState(store, { saving: true, error: null, notice: null });
        try {
          await api.createRecordType(body);
          patchState(store, { saving: false, notice: `Record type ${body.code} created.` });
          return load();
        } catch (err) {
          patchState(store, { saving: false, error: apiMessage(err) });
          return false;
        }
      },
      async toggleActive(type: RecordType) {
        patchState(store, { error: null, notice: null });
        try {
          await api.updateRecordType(type.code, {
            label: type.label,
            description: type.description,
            active: !type.active,
          });
          return load();
        } catch (err) {
          patchState(store, { error: apiMessage(err) });
          return false;
        }
      },
    };
  }),
);
