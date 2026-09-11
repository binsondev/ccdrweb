import { Component, signal } from '@angular/core';
import { protoBindings } from './mock';

@Component({
  selector: 'ccdr-proto-intake',
  template: `
    <ol class="proto-stepper" aria-label="Intake steps">
      @for (step of steps; track step.id; let i = $index) {
        <li [class.proto-step-on]="stepId() >= step.id">
          <span>{{ i + 1 }}</span>
          {{ step.label }}
        </li>
      }
    </ol>

    <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section class="proto-panel">
        <div class="flex items-center justify-between gap-3">
          <div>
            <h2 class="font-serif text-xl">Hospital intake v3</h2>
            <p class="text-[13px] text-[color:var(--proto-muted)]">
              Activated · header row 1 · ignore unmapped columns
            </p>
          </div>
          <span class="proto-flag proto-flag-key">Staged</span>
        </div>

        <div class="proto-table-wrap mt-4">
          <table class="proto-table">
            <thead>
              <tr>
                <th>Excel header</th>
                <th>Attribute</th>
              </tr>
            </thead>
            <tbody>
              @for (bind of bindings; track bind.header) {
                <tr>
                  <td>{{ bind.header }}</td>
                  <td class="font-mono text-[12px]">{{ bind.attribute }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <aside class="proto-panel">
        <p class="proto-kicker">ward_admissions.xlsx</p>
        <p class="font-serif text-3xl leading-none">128</p>
        <p class="mt-1 text-[13px] text-[color:var(--proto-muted)]">rows staged</p>
        <dl class="proto-stats">
          <div><dt>Valid</dt><dd>120</dd></div>
          <div><dt>Invalid</dt><dd>6</dd></div>
          <div><dt>Review</dt><dd>2</dd></div>
        </dl>
        <p class="mb-4 text-[12px] text-[color:var(--proto-muted)]">
          Policy: valid rows only. Invalid rows stay out of the registry.
        </p>
        <button type="button" class="proto-primary-btn w-full" (click)="stepId.set(4)">
          Commit 120 records
        </button>
        @if (stepId() === 4) {
          <p class="mt-3 text-[13px] text-[color:var(--proto-sage)]">
            Prototype: commit would write 118 created, 2 updated.
          </p>
        }
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
