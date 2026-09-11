import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { Api, apiMessage } from './api';
import { AttributeDefinition, MappingProfile } from './models';

type MappingsState = {
  loading: boolean;
  saving: boolean;
  error: string | null;
  notice: string | null;
  profiles: MappingProfile[];
  attributes: AttributeDefinition[];
};

const initial: MappingsState = {
  loading: false,
  saving: false,
  error: null,
  notice: null,
  profiles: [],
  attributes: [],
};

export const MappingsStore = signalStore(
  { providedIn: 'root' },
  withState(initial),
  withMethods((store, api = inject(Api)) => {
    const load = async () => {
      patchState(store, { loading: true, error: null });
      try {
        const [profiles, catalog] = await Promise.all([api.mappingProfiles(), api.attributes()]);
        patchState(store, {
          loading: false,
          profiles: profiles.profiles,
          attributes: catalog.attributes,
        });
        return true;
      } catch (err) {
        patchState(store, { loading: false, error: apiMessage(err) });
        return false;
      }
    };

    return {
      load,
      async create(body: {
        name: string;
        headerRowIndex: number;
        ignoreUnmappedColumns: boolean;
        isDefault: boolean;
        bindings: { excelHeader: string; attributeCode: string; transforms: string[] }[];
      }) {
        patchState(store, { saving: true, error: null, notice: null });
        try {
          await api.createMappingProfile(body);
          patchState(store, {
            saving: false,
            notice: 'Mapping profile created. Activate it before uploads.',
          });
          return load();
        } catch (err) {
          patchState(store, { saving: false, error: apiMessage(err) });
          return false;
        }
      },
      async activate(id: string) {
        patchState(store, { error: null, notice: null });
        try {
          await api.activateMapping(id);
          patchState(store, { notice: 'Mapping activated.' });
          return load();
        } catch (err) {
          patchState(store, { error: apiMessage(err) });
          return false;
        }
      },
    };
  }),
);
