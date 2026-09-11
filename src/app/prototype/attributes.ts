import { Component } from '@angular/core';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { protoAttributes } from './mock';

@Component({
  selector: 'ccdr-proto-attributes',
  imports: [HlmBadge, ...HlmAlertImports, ...HlmCardImports, ...HlmTableImports],
  template: `
    <div class="grid gap-6">
      <div hlmAlert>
        <p hlmAlertTitle>Match key is <code class="font-mono">mrn</code></p>
        <p hlmAlertDescription>
          Later uploads update an existing bag when this value matches. Codes cannot change after
          save.
        </p>
      </div>

      @for (group of groups; track group) {
        <section hlmCard>
          <div hlmCardHeader class="border-border border-b">
            <h2 hlmCardTitle>{{ group }}</h2>
          </div>
          <div hlmCardContent class="p-0">
            <div hlmTableContainer>
              <table hlmTable>
                <thead hlmTHead>
                  <tr hlmTr>
                    <th hlmTh>Code</th>
                    <th hlmTh>Label</th>
                    <th hlmTh>Type</th>
                    <th hlmTh>Flags</th>
                  </tr>
                </thead>
                <tbody hlmTBody>
                  @for (attr of byGroup(group); track attr.code) {
                    <tr hlmTr>
                      <td hlmTd class="font-mono text-xs">{{ attr.code }}</td>
                      <td hlmTd>{{ attr.label }}</td>
                      <td hlmTd>{{ attr.type }}</td>
                      <td hlmTd>
                        <div class="flex flex-wrap gap-1">
                          @if (attr.matchKey) {
                            <span hlmBadge>Match key</span>
                          }
                          @if (attr.required) {
                            <span hlmBadge variant="secondary">Required</span>
                          }
                          @if (attr.filterable) {
                            <span hlmBadge variant="outline">Filterable</span>
                          }
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </section>
      }
    </div>
  `,
})
export class PrototypeAttributes {
  protected readonly groups = ['Identity', 'Contact', 'Stay'];

  protected byGroup(group: string) {
    return protoAttributes.filter((attr) => attr.group === group);
  }
}
