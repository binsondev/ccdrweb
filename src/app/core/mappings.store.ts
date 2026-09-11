import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { Api, apiMessage } from './api';
import { AttributeDefinition, MappingProfile, MappingVersion } from './models';

type MappingsState = {
  loading: boolean;
  saving: boolean;
  detailLoading: boolean;
  error: string | null;
  notice: string | null;
  profiles: MappingProfile[];
  attributes: AttributeDefinition[];
  detail: MappingProfile | null;
  versions: MappingVersion[];
};

const initial: MappingsState = {
  loading: false,
  saving: false,
  detailLoading: false,
  error: null,
  notice: null,
  profiles: [],
  attributes: [],
  detail: null,
  versions: [],
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
      async loadDetail(id: string) {
        patchState(store, { detailLoading: true, error: null });
        try {
          const [detail, versions, catalog] = await Promise.all([
            api.mappingProfile(id),
            api.mappingVersions(id),
            api.attributes(),
          ]);
          patchState(store, {
            detailLoading: false,
            detail,
            versions: versions.versions,
            attributes: catalog.attributes,
          });
          return true;
        } catch (err) {
          patchState(store, { detailLoading: false, detail: null, error: apiMessage(err) });
          return false;
        }
      },
      clearDetail() {
        patchState(store, { detail: null, versions: [] });
      },
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
          await load();
          if (store.detail()?.id === id) {
            const [detail, versions] = await Promise.all([
              api.mappingProfile(id),
              api.mappingVersions(id),
            ]);
            patchState(store, { detail, versions: versions.versions });
          }
          return true;
        } catch (err) {
          patchState(store, { error: apiMessage(err) });
          return false;
        }
      },
    };
  }),
);
