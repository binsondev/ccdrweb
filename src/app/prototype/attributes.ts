import { Component } from '@angular/core';
import { protoAttributes } from './mock';

@Component({
  selector: 'ccdr-proto-attributes',
  template: `
    <div class="proto-callout">
      <p class="font-medium">Match key is <span class="font-mono">mrn</span></p>
      <p class="text-[13px] text-[color:var(--proto-muted)]">
        Later uploads update an existing bag when this value matches. Codes cannot change after save.
      </p>
    </div>

    @for (group of groups; track group) {
      <section class="mb-8">
        <h2 class="proto-group-title">{{ group }}</h2>
        <div class="proto-table-wrap">
          <table class="proto-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Label</th>
                <th>Type</th>
                <th>Flags</th>
              </tr>
            </thead>
            <tbody>
              @for (attr of byGroup(group); track attr.code) {
                <tr>
                  <td class="font-mono text-[12px]">{{ attr.code }}</td>
                  <td>{{ attr.label }}</td>
                  <td>{{ attr.type }}</td>
                  <td>
                    <div class="flex flex-wrap gap-1">
                      @if (attr.matchKey) {
                        <span class="proto-flag proto-flag-key">Match key</span>
                      }
                      @if (attr.required) {
                        <span class="proto-flag">Required</span>
                      }
                      @if (attr.filterable) {
                        <span class="proto-flag">Filterable</span>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    }
  `,
})
export class PrototypeAttributes {
  protected readonly groups = ['Identity', 'Contact', 'Stay'];

  protected byGroup(group: string) {
    return protoAttributes.filter((attr) => attr.group === group);
  }
}
