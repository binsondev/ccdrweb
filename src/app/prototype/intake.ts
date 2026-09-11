import { Component, signal } from '@angular/core';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { protoBindings } from './mock';

@Component({
  selector: 'ccdr-proto-intake',
  imports: [HlmBadge, HlmButton, ...HlmCardImports, ...HlmTableImports],
  template: `
    <ol class="mb-6 flex flex-wrap gap-2" aria-label="Intake steps">
      @for (step of steps; track step.id; let i = $index) {
        <li
          class="flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs"
          [class.border-primary]="stepId() >= step.id"
          [class.bg-primary]="stepId() >= step.id"
          [class.text-primary-foreground]="stepId() >= step.id"
          [class.border-border]="stepId() < step.id"
          [class.text-muted-foreground]="stepId() < step.id"
        >
          <span class="font-mono">{{ i + 1 }}</span>
          {{ step.label }}
        </li>
      }
    </ol>

    <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section hlmCard>
        <div hlmCardHeader class="border-border border-b">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 hlmCardTitle>Hospital intake v3</h2>
              <p hlmCardDescription>Activated · header row 1 · ignore unmapped columns</p>
            </div>
            <span hlmBadge variant="secondary">Staged</span>
          </div>
        </div>
        <div hlmCardContent class="p-0">
          <div hlmTableContainer>
            <table hlmTable>
              <thead hlmTHead>
                <tr hlmTr>
                  <th hlmTh>Excel header</th>
                  <th hlmTh>Attribute</th>
                </tr>
              </thead>
              <tbody hlmTBody>
                @for (bind of bindings; track bind.header) {
                  <tr hlmTr>
                    <td hlmTd>{{ bind.header }}</td>
                    <td hlmTd class="font-mono text-xs">{{ bind.attribute }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <aside hlmCard>
        <div hlmCardHeader>
          <p hlmCardDescription>ward_admissions.xlsx</p>
          <h2 class="text-3xl font-semibold tracking-tight">128</h2>
          <p class="text-muted-foreground text-sm">rows staged</p>
        </div>
        <div hlmCardContent class="grid gap-4">
          <dl class="grid grid-cols-3 gap-3 text-center">
            <div class="bg-muted rounded-md px-2 py-3">
              <dt class="text-muted-foreground text-[10px] tracking-[0.12em] uppercase">Valid</dt>
              <dd class="text-lg font-semibold">120</dd>
            </div>
            <div class="bg-muted rounded-md px-2 py-3">
              <dt class="text-muted-foreground text-[10px] tracking-[0.12em] uppercase">Invalid</dt>
              <dd class="text-lg font-semibold">6</dd>
            </div>
            <div class="bg-muted rounded-md px-2 py-3">
              <dt class="text-muted-foreground text-[10px] tracking-[0.12em] uppercase">Review</dt>
              <dd class="text-lg font-semibold">2</dd>
            </div>
          </dl>
          <p class="text-muted-foreground text-xs">
            Policy: valid rows only. Invalid rows stay out of the registry.
          </p>
          <button hlmBtn type="button" (click)="stepId.set(4)">Commit 120 records</button>
          @if (stepId() === 4) {
            <p class="text-primary text-sm">Prototype: commit would write 118 created, 2 updated.</p>
          }
        </div>
      </aside>
    </div>
  `,
})
export class PrototypeIntake {
  protected readonly bindings = protoBindings;
  protected readonly stepId = signal(3);
  protected readonly steps = [
    { id: 1, label: 'Profile' },
    { id: 2, label: 'Workbook' },
    { id: 3, label: 'Stage' },
    { id: 4, label: 'Commit' },
  ];
}
