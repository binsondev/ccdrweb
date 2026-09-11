import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { Api, apiMessage } from './api';
import { AttributeDefinition, DataType } from './models';

type AttributesState = {
  loading: boolean;
  saving: boolean;
  error: string | null;
  notice: string | null;
  tenant: string;
  businessType: string;
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
        const response = await api.attributes();
        patchState(store, {
          loading: false,
          tenant: response.tenant,
          businessType: response.businessType,
          matchKeyWarning: response.matchKeyWarning,
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
        patchState(store, { saving: true, error: null, notice: null });
        try {
          await api.createAttribute(body);
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
          await api.updateAttribute(attribute.code, { active: !attribute.active });
          return load();
        } catch (err) {
          patchState(store, { error: apiMessage(err) });
          return false;
        }
      },
    };
  }),
);
