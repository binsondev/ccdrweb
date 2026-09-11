import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { Api, apiMessage } from './api';
import { PlatformTenant } from './models';

type PlatformState = {
  loading: boolean;
  saving: boolean;
  error: string | null;
  notice: string | null;
  tenants: PlatformTenant[];
};

const initial: PlatformState = {
  loading: false,
  saving: false,
  error: null,
  notice: null,
  tenants: [],
};

export const PlatformStore = signalStore(
  { providedIn: 'root' },
  withState(initial),
  withMethods((store, api = inject(Api)) => {
    const load = async () => {
      patchState(store, { loading: true, error: null });
      try {
        const response = await api.platformTenants();
        patchState(store, { loading: false, tenants: response.tenants });
        return true;
      } catch (err) {
        patchState(store, { loading: false, error: apiMessage(err) });
        return false;
      }
    };

    return {
      load,
      async create(identifier: string, name: string, businessType: string) {
        patchState(store, { saving: true, error: null, notice: null });
        try {
          await api.createPlatformTenant(identifier, name, businessType);
          patchState(store, { saving: false, notice: `Tenant ${identifier} created.` });
          return load();
        } catch (err) {
          patchState(store, { saving: false, error: apiMessage(err) });
          return false;
        }
      },
      async assignAdmin(tenantId: string, email: string) {
        patchState(store, { saving: true, error: null, notice: null });
        try {
          await api.assignTenantAdmin(tenantId, email);
          patchState(store, { saving: false, notice: `Assigned Tenant Admin ${email}.` });
          return true;
        } catch (err) {
          patchState(store, { saving: false, error: apiMessage(err) });
          return false;
        }
      },
    };
  }),
);
