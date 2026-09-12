import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { Api, apiMessage } from './api';
import { AttributeDefinition, DataType, RecordType } from './models';

type AttributesState = {
  loading: boolean;
  saving: boolean;
  error: string | null;
  notice: string | null;
  tenant: string;
  businessType: string;
  recordType: string;
  recordTypes: RecordType[];
  matchKeyWarning: string | null;
  attributes: AttributeDefinition[];
};

const initial: AttributesState = {
  loading: false,
  saving: false,
  error: null,
  notice: null,
  tenant: '',
  businessType: '',
  recordType: '',
  recordTypes: [],
  matchKeyWarning: null,
  attributes: [],
};

export const AttributesStore = signalStore(
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
        const response = recordType
          ? await api.attributes(recordType)
          : { tenant: types.tenant, businessType: '', matchKeyWarning: null, attributes: [] };
        patchState(store, {
          loading: false,
          tenant: response.tenant,
          businessType: 'businessType' in response ? response.businessType : store.businessType(),
          recordType,
          recordTypes: types.recordTypes,
          matchKeyWarning: recordType ? response.matchKeyWarning : null,
          attributes: response.attributes,
        });
        return true;
      } catch (err) {
        patchState(store, { loading: false, error: apiMessage(err) });
        return false;
      }
    };

    return {
      load,
      setRecordType(recordType: string) {
        patchState(store, { recordType });
        return load();
      },
      async create(body: {
        code: string;
        label: string;
        dataType: DataType;
        required: boolean;
        matchKey: boolean;
        filterable: boolean;
        listVisible: boolean;
        pii: boolean;
        active: boolean;
        group?: string | null;
        helpText?: string | null;
      }) {
        const recordType = store.recordType();
        if (!recordType) {
          patchState(store, { error: 'Choose a record type before adding attributes.' });
          return false;
        }
        patchState(store, { saving: true, error: null, notice: null });
        try {
          await api.createAttribute({ ...body, recordType });
          patchState(store, { saving: false, notice: `Attribute ${body.code} created.` });
          return load();
        } catch (err) {
          patchState(store, { saving: false, error: apiMessage(err) });
          return false;
        }
      },
      async toggleActive(attribute: AttributeDefinition) {
        patchState(store, { error: null, notice: null });
        try {
          await api.updateAttribute(attribute.recordType, attribute.code, { active: !attribute.active });
          return load();
        } catch (err) {
          patchState(store, { error: apiMessage(err) });
          return false;
        }
      },
    };
  }),
);
