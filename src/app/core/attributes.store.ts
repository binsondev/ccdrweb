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

    const persist = async (
      code: string,
      body: {
        label: string;
        group?: string | null;
        required: boolean;
        matchKey: boolean;
        filterable: boolean;
        listVisible: boolean;
        pii: boolean;
        active: boolean;
        helpText?: string | null;
        options?: { value: string; label: string; sortOrder?: number }[];
      },
    ) => {
      const recordType = store.recordType();
      const current = store.attributes().find((attr) => attr.code === code);
      if (!recordType || !current) {
        patchState(store, { error: 'Choose an attribute to edit.' });
        return false;
      }
      patchState(store, { saving: true, error: null, notice: null });
      try {
        await api.updateAttribute(recordType, code, {
          label: body.label,
          group: body.group ?? null,
          dataType: current.dataType,
          required: body.required,
          matchKey: body.matchKey,
          filterable: body.filterable,
          listVisible: body.listVisible,
          pii: body.pii,
          active: body.active,
          helpText: body.helpText ?? null,
          defaultValue: current.defaultValue,
          sortOrder: current.sortOrder,
          options: (body.options ?? current.options).map((option, index) => ({
            value: option.value,
            label: option.label,
            sortOrder: option.sortOrder ?? (index + 1) * 10,
          })),
        });
        patchState(store, { saving: false, notice: `Attribute ${code} updated.` });
        return load();
      } catch (err) {
        patchState(store, { saving: false, error: apiMessage(err) });
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
        options?: { value: string; label: string; sortOrder?: number }[];
      }) {
        const recordType = store.recordType();
        if (!recordType) {
          patchState(store, { error: 'Choose a record type before adding attributes.' });
          return false;
        }
        patchState(store, { saving: true, error: null, notice: null });
        try {
          await api.createAttribute({
            ...body,
            recordType,
            options: body.options?.map((option, index) => ({
              value: option.value,
              label: option.label,
              sortOrder: option.sortOrder ?? (index + 1) * 10,
            })),
          });
          patchState(store, { saving: false, notice: `Attribute ${body.code} created.` });
          return load();
        } catch (err) {
          patchState(store, { saving: false, error: apiMessage(err) });
          return false;
        }
      },
      async update(
        code: string,
        body: {
          label: string;
          group?: string | null;
          required: boolean;
          matchKey: boolean;
          filterable: boolean;
          listVisible: boolean;
          pii: boolean;
          active: boolean;
          helpText?: string | null;
          options?: { value: string; label: string; sortOrder?: number }[];
        },
      ) {
        return persist(code, body);
      },
      toggleActive(attribute: AttributeDefinition) {
        return persist(attribute.code, {
          label: attribute.label,
          group: attribute.group,
          required: attribute.required,
          matchKey: attribute.matchKey,
          filterable: attribute.filterable,
          listVisible: attribute.listVisible,
          pii: attribute.pii,
          active: !attribute.active,
          helpText: attribute.helpText,
          options: attribute.options,
        });
      },
    };
  }),
);
