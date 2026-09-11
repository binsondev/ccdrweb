import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { Api, apiMessage } from './api';
import { AttributeDefinition, Customer, FilterableAttribute } from './models';

type CustomersState = {
  loading: boolean;
  saving: boolean;
  error: string | null;
  notice: string | null;
  q: string;
  filterCode: string;
  filterOp: string;
  filterValue: string;
  customers: Customer[];
  count: number;
  attributes: AttributeDefinition[];
  filterable: FilterableAttribute[];
  matchKeyWarning: string | null;
};

const initial: CustomersState = {
  loading: false,
  saving: false,
  error: null,
  notice: null,
  q: '',
  filterCode: '',
  filterOp: '',
  filterValue: '',
  customers: [],
  count: 0,
  attributes: [],
  filterable: [],
  matchKeyWarning: null,
};

export const CustomersStore = signalStore(
  { providedIn: 'root' },
  withState(initial),
  withMethods((store, api = inject(Api)) => {
    const load = async () => {
      patchState(store, { loading: true, error: null });
      try {
        const filter =
          store.filterCode() && store.filterValue()
            ? [
                store.filterOp()
                  ? `${store.filterCode()}:${store.filterOp()}:${store.filterValue()}`
                  : `${store.filterCode()}:${store.filterValue()}`,
              ]
            : [];
        const [catalog, filterable, list] = await Promise.all([
          api.attributes(),
          api.filterableAttributes(),
          api.customers({ q: store.q() || undefined, filter, limit: 100 }),
        ]);
        patchState(store, {
          loading: false,
          attributes: catalog.attributes,
          matchKeyWarning: catalog.matchKeyWarning,
          filterable: filterable.attributes,
          customers: list.customers,
          count: list.count,
        });
        return true;
      } catch (err) {
        patchState(store, { loading: false, error: apiMessage(err) });
        return false;
      }
    };

    return {
      setSearch(q: string) {
        patchState(store, { q });
      },
      setFilter(code: string, op: string, value: string) {
        patchState(store, { filterCode: code, filterOp: op, filterValue: value });
      },
      load,
      async create(attributes: Record<string, unknown>) {
        patchState(store, { saving: true, error: null, notice: null });
        try {
          const saved = await api.saveCustomer(attributes);
          patchState(store, {
            saving: false,
            notice: saved.outcome === 'updated' ? 'Existing customer updated.' : 'Customer created.',
          });
          return load();
        } catch (err) {
          patchState(store, { saving: false, error: apiMessage(err) });
          return false;
        }
      },
    };
  }),
);
