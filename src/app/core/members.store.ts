import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { Api, apiMessage } from './api';
import { AppRole, Member } from './models';

type MembersState = {
  loading: boolean;
  saving: boolean;
  error: string | null;
  notice: string | null;
  members: Member[];
};

const initial: MembersState = {
  loading: false,
  saving: false,
  error: null,
  notice: null,
  members: [],
};

export const MembersStore = signalStore(
  { providedIn: 'root' },
  withState(initial),
  withMethods((store, api = inject(Api)) => {
    const load = async () => {
      patchState(store, { loading: true, error: null });
      try {
        const response = await api.members();
        patchState(store, { loading: false, members: response.members });
        return true;
      } catch (err) {
        patchState(store, { loading: false, error: apiMessage(err) });
        return false;
      }
    };

    return {
      load,
      async invite(email: string, role: AppRole, exportGranted: boolean) {
        patchState(store, { saving: true, error: null, notice: null });
        try {
          await api.addMember(email, role, exportGranted);
          patchState(store, { saving: false, notice: `Invited ${email}.` });
          return load();
        } catch (err) {
          patchState(store, { saving: false, error: apiMessage(err) });
          return false;
        }
      },
      async changeRole(id: string, role: AppRole, exportGranted: boolean) {
        patchState(store, { error: null, notice: null });
        try {
          await api.updateMember(id, role, exportGranted);
          return load();
        } catch (err) {
          patchState(store, { error: apiMessage(err) });
          return false;
        }
      },
      async remove(id: string) {
        patchState(store, { error: null, notice: null });
        try {
          await api.removeMember(id);
          patchState(store, { notice: 'Membership removed.' });
          return load();
        } catch (err) {
          patchState(store, { error: apiMessage(err) });
          return false;
        }
      },
    };
  }),
);
