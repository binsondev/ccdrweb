import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { Api, apiMessage } from './api';
import { AttributeDefinition, MappingBindingDraft, MappingProfile, MappingVersion, RecordType } from './models';

type MappingsState = {
  loading: boolean;
  saving: boolean;
  detailLoading: boolean;
  downloading: boolean;
  error: string | null;
  notice: string | null;
  recordType: string;
  recordTypes: RecordType[];
  profiles: MappingProfile[];
  attributes: AttributeDefinition[];
  detail: MappingProfile | null;
  versions: MappingVersion[];
};

const initial: MappingsState = {
  loading: false,
  saving: false,
  detailLoading: false,
  downloading: false,
  error: null,
  notice: null,
  recordType: '',
  recordTypes: [],
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
        const types = await api.recordTypes();
        const active = types.recordTypes.filter((type) => type.active);
        let recordType = store.recordType();
        if (!recordType || !active.some((type) => type.code === recordType)) {
          recordType = active[0]?.code ?? '';
        }
        const [profiles, catalog] = await Promise.all([
          api.mappingProfiles(recordType || undefined),
          recordType ? api.attributes(recordType) : Promise.resolve({ attributes: [] as AttributeDefinition[] }),
        ]);
        patchState(store, {
          loading: false,
          recordType,
          recordTypes: types.recordTypes,
          profiles: profiles.profiles,
          attributes: catalog.attributes,
        });
        return true;
      } catch (err) {
        patchState(store, { loading: false, error: apiMessage(err) });
        return false;
      }
    };

    const loadDetail = async (id: string) => {
      patchState(store, { detailLoading: true, error: null });
      try {
        const [detail, versions] = await Promise.all([
          api.mappingProfile(id),
          api.mappingVersions(id),
        ]);
        const catalog = await api.attributes(detail.recordType);
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
    };

    return {
      load,
      loadDetail,
      setRecordType(recordType: string) {
        patchState(store, { recordType });
        return load();
      },
      clearDetail() {
        patchState(store, { detail: null, versions: [] });
      },
      async create(body: {
        recordType: string;
        name: string;
        headerRowIndex: number;
        ignoreUnmappedColumns: boolean;
        isDefault: boolean;
        bindings: {
          excelHeader: string;
          attributeCode: string;
          transforms: string[];
          dateFormat?: string | null;
        }[];
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
      async saveBindings(id: string, drafts: MappingBindingDraft[]) {
        const detail = store.detail();
        if (!detail) return false;
        const bindings = drafts
          .filter((row) => row.excelHeader.trim() && row.attributeCode)
          .map((row) => ({
            excelHeader: row.excelHeader.trim(),
            attributeCode: row.attributeCode,
            transforms: row.transforms,
            dateFormat: row.dateFormat.trim() || null,
          }));
        const wasImmutable = detail.current.immutable;
        patchState(store, { saving: true, error: null, notice: null });
        try {
          const saved = await api.updateMappingProfile(id, {
            name: detail.name,
            description: detail.description,
            sheetName: detail.current.sheetName,
            headerRowIndex: detail.current.headerRowIndex,
            ignoreUnmappedColumns: detail.current.ignoreUnmappedColumns,
            isDefault: detail.isDefault,
            bindings,
          });
          patchState(store, {
            saving: false,
            notice: wasImmutable
              ? `Saved as v${saved.current.versionNumber}. Activate it before uploads use the new columns.`
              : 'Bindings saved.',
          });
          await load();
          return loadDetail(id);
        } catch (err) {
          patchState(store, { saving: false, error: apiMessage(err) });
          return false;
        }
      },
      async downloadTemplate(id: string) {
        patchState(store, { downloading: true, error: null, notice: null });
        try {
          const file = await api.downloadMappingTemplate(id);
          const url = URL.createObjectURL(file.blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = file.fileName;
          link.click();
          URL.revokeObjectURL(url);
          patchState(store, { downloading: false, notice: `Downloaded ${file.fileName}. Fill the header row, then upload.` });
          return true;
        } catch (err) {
          patchState(store, { downloading: false, error: apiMessage(err) });
          return false;
        }
      },
      async clone(id: string) {
        patchState(store, { saving: true, error: null, notice: null });
        try {
          const { profiles } = await api.mappingProfiles();
          const source = profiles.find((profile) => profile.id === id);
          if (!source) {
            patchState(store, { saving: false, error: 'Mapping profile was not found.' });
            return null;
          }
          const taken = new Set(profiles.map((profile) => profile.name.toLowerCase()));
          let name = `${source.name} copy`;
          let n = 2;
          while (taken.has(name.toLowerCase())) {
            name = `${source.name} copy ${n++}`;
          }
          const copied = await api.cloneMapping(id, name);
          patchState(store, {
            saving: false,
            notice: `Copied as “${copied.name}”. It is a draft until you activate it.`,
          });
          await load();
          return copied;
        } catch (err) {
          patchState(store, { saving: false, error: apiMessage(err) });
          return null;
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
