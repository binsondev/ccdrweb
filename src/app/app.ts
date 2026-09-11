import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeStore } from './core/theme.store';

@Component({
  selector: 'ccdr-root',
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class App {
  private readonly theme = inject(ThemeStore);
}
