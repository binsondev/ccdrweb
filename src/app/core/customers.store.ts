import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { Api, apiMessage } from './api';
import { AttributeDefinition, Customer, FilterableAttribute } from './models';
import { operatorLabel } from './format';

export type TextDraft = { op: string; value: string };

export type FilterChip = {
  id: string;
  kind: 'text' | 'opt' | 'min' | 'max' | 'bool';
  code: string;
  extra?: string;
  label: string;
};

type CustomersState = {
  loading: boolean;
  saving: boolean;
  error: string | null;
  notice: string | null;
  q: string;
  text: Record<string, TextDraft>;
  options: Record<string, string[]>;
  min: Record<string, string>;
  max: Record<string, string>;
  bools: Record<string, string>;
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
  text: {},
  options: {},
  min: {},
  max: {},
  bools: {},
  customers: [],
  count: 0,
  attributes: [],
  filterable: [],
  matchKeyWarning: null,
};

function serialize(state: {
  text: Record<string, TextDraft>;
  options: Record<string, string[]>;
  min: Record<string, string>;
  max: Record<string, string>;
  bools: Record<string, string>;
}): string[] {
  const filters: string[] = [];
  for (const [code, draft] of Object.entries(state.text)) {
    if (draft.value.trim()) {
      filters.push(`${code}:${draft.op}:${draft.value.trim()}`);
    }
  }
  for (const [code, values] of Object.entries(state.options)) {
    for (const value of values) {
      filters.push(`${code}:eq:${value}`);
    }
  }
  for (const [code, value] of Object.entries(state.min)) {
    if (value) filters.push(`${code}:gte:${value}`);
  }
  for (const [code, value] of Object.entries(state.max)) {
    if (value) filters.push(`${code}:lte:${value}`);
  }
  for (const [code, value] of Object.entries(state.bools)) {
    if (value) filters.push(`${code}:eq:${value}`);
  }
  return filters;
}

export const CustomersStore = signalStore(
  { providedIn: 'root' },
  withState(initial),
  withComputed((store) => ({
    chips: computed(() => {
      const items: FilterChip[] = [];
      for (const attr of store.filterable()) {
        const text = store.text()[attr.code];
        if (text?.value.trim()) {
          items.push({
            id: `text:${attr.code}`,
            kind: 'text',
            code: attr.code,
            label: `${attr.label} ${operatorLabel(text.op)} “${text.value.trim()}”`,
          });
        }
        for (const value of store.options()[attr.code] ?? []) {
          items.push({
            id: `opt:${attr.code}:${value}`,
            kind: 'opt',
            code: attr.code,
            extra: value,
            label: `${attr.label}: ${value}`,
          });
        }
        const min = store.min()[attr.code];
        if (min) {
          items.push({
            id: `min:${attr.code}`,
            kind: 'min',
            code: attr.code,
            label: `${attr.label} ≥ ${min}`,
          });
        }
        const max = store.max()[attr.code];
        if (max) {
          items.push({
            id: `max:${attr.code}`,
            kind: 'max',
            code: attr.code,
            label: `${attr.label} ≤ ${max}`,
          });
        }
        const bool = store.bools()[attr.code];
        if (bool) {
          items.push({
            id: `bool:${attr.code}`,
            kind: 'bool',
            code: attr.code,
            label: `${attr.label}: ${bool === 'true' ? 'Yes' : 'No'}`,
          });
        }
      }
      return items;
    }),
    groups: computed(() => {
      const names = store.filterable().map((attr) => attr.group?.trim() || 'Other');
      return [...new Set(names)];
    }),
  })),
  withMethods((store, api = inject(Api)) => {
    const load = async () => {
      patchState(store, { loading: true, error: null });
      try {
        const filter = serialize({
          text: store.text(),
          options: store.options(),
          min: store.min(),
          max: store.max(),
          bools: store.bools(),
        });
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
      setTextOp(code: string, op: string) {
        patchState(store, {
          text: { ...store.text(), [code]: { op, value: store.text()[code]?.value ?? '' } },
        });
      },
      setTextValue(code: string, fallbackOp: string, value: string) {
        patchState(store, {
          text: {
            ...store.text(),
            [code]: { op: store.text()[code]?.op ?? fallbackOp, value },
          },
        });
      },
      setOption(code: string, value: string, checked: boolean) {
        const next = new Set(store.options()[code] ?? []);
        if (checked) next.add(value);
        else next.delete(value);
        patchState(store, { options: { ...store.options(), [code]: [...next] } });
      },
      toggleOption(code: string, value: string) {
        const next = new Set(store.options()[code] ?? []);
        if (next.has(value)) next.delete(value);
        else next.add(value);
        patchState(store, { options: { ...store.options(), [code]: [...next] } });
      },
      setMin(code: string, value: string) {
        patchState(store, { min: { ...store.min(), [code]: value } });
      },
      setMax(code: string, value: string) {
        patchState(store, { max: { ...store.max(), [code]: value } });
      },
      setBool(code: string, value: string) {
        patchState(store, { bools: { ...store.bools(), [code]: value } });
      },
      removeChip(chip: FilterChip) {
        if (chip.kind === 'text') {
          patchState(store, {
            text: {
              ...store.text(),
              [chip.code]: { op: store.text()[chip.code]?.op ?? 'contains', value: '' },
            },
          });
        }
        if (chip.kind === 'opt' && chip.extra) {
          const next = new Set(store.options()[chip.code] ?? []);
          next.delete(chip.extra);
          patchState(store, { options: { ...store.options(), [chip.code]: [...next] } });
        }
        if (chip.kind === 'min') {
          patchState(store, { min: { ...store.min(), [chip.code]: '' } });
        }
        if (chip.kind === 'max') {
          patchState(store, { max: { ...store.max(), [chip.code]: '' } });
        }
        if (chip.kind === 'bool') {
          patchState(store, { bools: { ...store.bools(), [chip.code]: '' } });
        }
      },
      clearFilters() {
        patchState(store, { q: '', text: {}, options: {}, min: {}, max: {}, bools: {} });
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
