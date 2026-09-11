import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { Api, apiMessage } from './api';
import { SettingsResponse } from './models';

type SettingsState = {
  loading: boolean;
  saving: boolean;
  error: string | null;
  notice: string | null;
  settings: SettingsResponse | null;
};

const initial: SettingsState = {
  loading: false,
  saving: false,
  error: null,
  notice: null,
  settings: null,
};

export const SettingsStore = signalStore(
  { providedIn: 'root' },
  withState(initial),
  withMethods((store, api = inject(Api)) => ({
    async load() {
      patchState(store, { loading: true, error: null });
      try {
        const settings = await api.settings();
        patchState(store, { loading: false, settings });
      } catch (err) {
        patchState(store, { loading: false, error: apiMessage(err) });
      }
    },
    async save(uploadCommitPolicy: 'ValidOnly' | 'AllOrNothing') {
      patchState(store, { saving: true, error: null, notice: null });
      try {
        const settings = await api.saveSettings(uploadCommitPolicy);
        patchState(store, { saving: false, settings, notice: 'Commit policy saved.' });
      } catch (err) {
        patchState(store, { saving: false, error: apiMessage(err) });
      }
    },
  })),
);
