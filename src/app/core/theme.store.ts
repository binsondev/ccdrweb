import { computed, effect } from '@angular/core';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';

const KEY = 'ccdr.theme';

export const ThemeStore = signalStore(
  { providedIn: 'root' },
  withState({ dark: false }),
  withComputed((store) => ({
    label: computed(() => (store.dark() ? 'Light' : 'Dark')),
  })),
  withMethods((store) => ({
    toggle() {
      const dark = !store.dark();
      patchState(store, { dark });
      try {
        localStorage.setItem(KEY, dark ? 'dark' : 'light');
      } catch {
        /* ignore */
      }
    },
  })),
  withHooks({
    onInit(store) {
      try {
        if (localStorage.getItem(KEY) === 'dark') {
          patchState(store, { dark: true });
        }
      } catch {
        /* ignore */
      }
      effect(() => {
        document.documentElement.classList.toggle('dark', store.dark());
      });
    },
  }),
);
