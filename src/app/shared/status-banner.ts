import { Component, input } from '@angular/core';
import { HlmAlertImports } from '@spartan-ng/helm/alert';

@Component({
  selector: 'ccdr-status',
  imports: [...HlmAlertImports],
  template: `
    @if (error()) {
      <div hlmAlert variant="destructive">
        <p hlmAlertTitle>Request failed</p>
        <p hlmAlertDescription>{{ error() }}</p>
      </div>
    }
    @if (notice()) {
      <div hlmAlert>
        <p hlmAlertTitle>Saved</p>
        <p hlmAlertDescription>{{ notice() }}</p>
      </div>
    }
  `,
  host: { class: 'grid gap-3 empty:hidden' },
})
export class StatusBanner {
  readonly error = input<string | null>(null);
  readonly notice = input<string | null>(null);
}
