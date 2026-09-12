import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { Api, apiMessage } from './api';
import { AttributeDefinition, Customer, FilterableAttribute, RecordType } from './models';
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
  recordType: string;
  recordTypes: RecordType[];
  text: Record<string, TextDraft>;
  options: Record<string, string[]>;
  min: Record<string, string>;
  max: Record<string, string>;
  bools: Record<string, string>;
  customers: Customer[];
  count: number;
  offset: number;
  limit: number;
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
  recordType: '',
  recordTypes: [],
  text: {},
  options: {},
  min: {},
  max: {},
  bools: {},
  customers: [],
  count: 0,
  offset: 0,
  limit: 25,
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
            id: `text:${attr.recordType}:${attr.code}`,
            kind: 'text',
            code: attr.code,
            label: `${attr.label} ${operatorLabel(text.op)} “${text.value.trim()}”`,
          });
        }
        for (const value of store.options()[attr.code] ?? []) {
          items.push({
            id: `opt:${attr.recordType}:${attr.code}:${value}`,
            kind: 'opt',
            code: attr.code,
            extra: value,
            label: `${attr.label}: ${value}`,
          });
        }
        const min = store.min()[attr.code];
        if (min) {
          items.push({
            id: `min:${attr.recordType}:${attr.code}`,
            kind: 'min',
            code: attr.code,
            label: `${attr.label} ≥ ${min}`,
          });
        }
        const max = store.max()[attr.code];
        if (max) {
          items.push({
            id: `max:${attr.recordType}:${attr.code}`,
            kind: 'max',
            code: attr.code,
            label: `${attr.label} ≤ ${max}`,
          });
        }
        const bool = store.bools()[attr.code];
        if (bool) {
          items.push({
            id: `bool:${attr.recordType}:${attr.code}`,
            kind: 'bool',
            code: attr.code,
            label: `${attr.label}: ${bool === 'true' ? 'Yes' : 'No'}`,
          });
        }
      }
      return items;
    }),
    groups: computed(() => {
      if (!store.recordType()) {
        const names = store.filterable().map((attr) => attr.recordType || 'Other');
        return [...new Set(names)];
      }
      const names = store.filterable().map((attr) => attr.group?.trim() || 'Other');
      return [...new Set(names)];
    }),
    typeLabel: computed(() => {
      const byCode = new Map(store.recordTypes().map((type) => [type.code, type.label]));
      return (code: string) => byCode.get(code) ?? code;
    }),
    page: computed(() => Math.floor(store.offset() / store.limit()) + 1),
    pageCount: computed(() => Math.max(1, Math.ceil(store.count() / store.limit()))),
    from: computed(() => (store.count() === 0 ? 0 : store.offset() + 1)),
    to: computed(() => Math.min(store.offset() + store.customers().length, store.count())),
    hasPrev: computed(() => store.offset() > 0),
    hasNext: computed(() => store.offset() + store.limit() < store.count()),
  })),
  withMethods((store, api = inject(Api)) => {
    const query = () =>
      serialize({
        text: store.text(),
        options: store.options(),
        min: store.min(),
        max: store.max(),
        bools: store.bools(),
      });

    const search = async (): Promise<boolean> => {
      patchState(store, { loading: true, error: null });
      try {
        const recordType = store.recordType() || undefined;
        const list = await api.customers({
          q: store.q() || undefined,
          recordType,
          filter: query(),
          offset: store.offset(),
          limit: store.limit(),
        });
        const lastOffset =
          list.count > 0 ? Math.floor((list.count - 1) / list.limit) * list.limit : 0;
        if (list.offset > lastOffset) {
          patchState(store, { offset: lastOffset, count: list.count, limit: list.limit });
          return search();
        }
        patchState(store, {
          loading: false,
          customers: list.customers,
          count: list.count,
          offset: list.offset,
          limit: list.limit,
        });
        return true;
      } catch (err) {
        patchState(store, { loading: false, error: apiMessage(err) });
        return false;
      }
    };

    const load = async (resetPage = true) => {
      if (resetPage) {
        patchState(store, { offset: 0 });
      }
      patchState(store, { loading: true, error: null });
      try {
        const recordType = store.recordType() || undefined;
        const [types, catalog, filterable, list] = await Promise.all([
          api.recordTypes(),
          api.attributes(),
          api.filterableAttributes(recordType),
          api.customers({
            q: store.q() || undefined,
            recordType,
            filter: query(),
            offset: resetPage ? 0 : store.offset(),
            limit: store.limit(),
          }),
        ]);
        const scoped = recordType
          ? catalog.attributes.filter((attr) => attr.recordType === recordType)
          : catalog.attributes;
        const hasMatchKey = scoped.some((attr) => attr.active && attr.matchKey);
        patchState(store, {
          loading: false,
          recordTypes: types.recordTypes,
          attributes: catalog.attributes,
          matchKeyWarning: recordType && !hasMatchKey
            ? `At least one match-key attribute is recommended on '${recordType}' so later uploads can update existing records.`
            : null,
          filterable: filterable.attributes,
          customers: list.customers,
          count: list.count,
          offset: list.offset,
          limit: list.limit,
        });
        return true;
      } catch (err) {
        patchState(store, { loading: false, error: apiMessage(err) });
        return false;
      }
    };

    return {
      setSearch(q: string) {
        patchState(store, { q, offset: 0 });
      },
      search,
      setRecordType(recordType: string) {
        patchState(store, {
          recordType,
          offset: 0,
          text: {},
          options: {},
          min: {},
          max: {},
          bools: {},
        });
        return load();
      },
      setTextOp(code: string, op: string) {
        patchState(store, {
          offset: 0,
          text: { ...store.text(), [code]: { op, value: store.text()[code]?.value ?? '' } },
        });
      },
      setTextValue(code: string, fallbackOp: string, value: string) {
        patchState(store, {
          offset: 0,
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
        patchState(store, { offset: 0, options: { ...store.options(), [code]: [...next] } });
      },
      toggleOption(code: string, value: string) {
        const next = new Set(store.options()[code] ?? []);
        if (next.has(value)) next.delete(value);
        else next.add(value);
        patchState(store, { offset: 0, options: { ...store.options(), [code]: [...next] } });
      },
      setMin(code: string, value: string) {
        patchState(store, { offset: 0, min: { ...store.min(), [code]: value } });
      },
      setMax(code: string, value: string) {
        patchState(store, { offset: 0, max: { ...store.max(), [code]: value } });
      },
      setBool(code: string, value: string) {
        patchState(store, { offset: 0, bools: { ...store.bools(), [code]: value } });
      },
      removeChip(chip: FilterChip) {
        if (chip.kind === 'text') {
          patchState(store, {
            offset: 0,
            text: {
              ...store.text(),
              [chip.code]: { op: store.text()[chip.code]?.op ?? 'contains', value: '' },
            },
          });
        }
        if (chip.kind === 'opt' && chip.extra) {
          const next = new Set(store.options()[chip.code] ?? []);
          next.delete(chip.extra);
          patchState(store, { offset: 0, options: { ...store.options(), [chip.code]: [...next] } });
        }
        if (chip.kind === 'min') {
          patchState(store, { offset: 0, min: { ...store.min(), [chip.code]: '' } });
        }
        if (chip.kind === 'max') {
          patchState(store, { offset: 0, max: { ...store.max(), [chip.code]: '' } });
        }
        if (chip.kind === 'bool') {
          patchState(store, { offset: 0, bools: { ...store.bools(), [chip.code]: '' } });
        }
      },
      clearFilters() {
        patchState(store, { q: '', text: {}, options: {}, min: {}, max: {}, bools: {}, offset: 0 });
      },
      goToPage(page: number) {
        const next = Math.min(Math.max(1, page), store.pageCount());
        patchState(store, { offset: (next - 1) * store.limit() });
        return search();
      },
      nextPage() {
        if (!store.hasNext()) return Promise.resolve(false);
        patchState(store, { offset: store.offset() + store.limit() });
        return search();
      },
      prevPage() {
        if (!store.hasPrev()) return Promise.resolve(false);
        patchState(store, { offset: Math.max(0, store.offset() - store.limit()) });
        return search();
      },
      setLimit(size: number) {
        const next = Math.min(200, Math.max(1, size));
        patchState(store, { limit: next, offset: 0 });
        return search();
      },
      load,
      async create(recordType: string, attributes: Record<string, unknown>) {
        patchState(store, { saving: true, error: null, notice: null });
        try {
          const saved = await api.saveCustomer(recordType, attributes);
          patchState(store, {
            saving: false,
            notice: saved.outcome === 'updated' ? 'Existing record updated.' : 'Record created.',
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
