import { Component, input, output } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCheckbox } from '@spartan-ng/helm/checkbox';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import {
  AttributeDefinition,
  CELL_TRANSFORM_OPTIONS,
  CELL_TRANSFORMS,
  emptyBindingDraft,
  MappingBindingDraft,
} from '../core/models';

@Component({
  selector: 'ccdr-mapping-bindings',
  imports: [HlmButton, HlmCheckbox, HlmInput, HlmLabel],
  template: `
    <div class="grid gap-4">
      @for (row of bindings(); track $index; let i = $index) {
        <div class="border-border grid gap-3 rounded-md border p-3">
          <div class="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
            <input
              hlmInput
              [value]="row.excelHeader"
              (input)="setField(i, 'excelHeader', $event)"
              placeholder="Excel header"
            />
            <select hlmInput [value]="row.attributeCode" (change)="setField(i, 'attributeCode', $event)">
              <option value="">Attribute</option>
              @for (attr of attributes(); track attr.code) {
                <option [value]="attr.code">{{ attr.label }} ({{ attr.code }})</option>
              }
            </select>
            <button hlmBtn variant="ghost" size="sm" type="button" (click)="remove(i)">Remove</button>
          </div>
          <div>
            <p class="text-muted-foreground mb-2 text-[11px] tracking-[0.12em] uppercase">Transforms</p>
            <div class="flex flex-wrap gap-x-4 gap-y-2">
              @for (option of transformOptions; track option.value) {
                <label hlmLabel class="font-normal">
                  <hlm-checkbox
                    [checked]="row.transforms.includes(option.value)"
                    (checkedChange)="toggleTransform(i, option.value, $event)"
                  />
                  <span [title]="option.hint">{{ option.label }}</span>
                </label>
              }
            </div>
          </div>
          @if (needsDateFormat(row.attributeCode)) {
            <label class="grid max-w-xs gap-1 text-sm">
              Date format
              <input
                hlmInput
                [value]="row.dateFormat"
                (input)="setField(i, 'dateFormat', $event)"
                placeholder="dd/MM/yyyy"
              />
            </label>
          }
        </div>
      }
      <button hlmBtn variant="outline" class="w-fit" type="button" (click)="add()">Add column</button>
    </div>
  `,
})
export class MappingBindingsEditor {
  readonly bindings = input.required<MappingBindingDraft[]>();
  readonly attributes = input.required<AttributeDefinition[]>();
  readonly bindingsChange = output<MappingBindingDraft[]>();

  protected readonly transformOptions = CELL_TRANSFORM_OPTIONS;

  protected needsDateFormat(code: string) {
    const type = this.attributes().find((attr) => attr.code === code)?.dataType;
    return type === 'Date' || type === 'DateTime';
  }

  protected add() {
    this.bindingsChange.emit([...this.bindings(), emptyBindingDraft()]);
  }

  protected remove(index: number) {
    this.bindingsChange.emit(this.bindings().filter((_, i) => i !== index));
  }

  protected setField(index: number, key: 'excelHeader' | 'attributeCode' | 'dateFormat', event: Event) {
    const value = (event.target as HTMLInputElement | HTMLSelectElement).value;
    this.bindingsChange.emit(
      this.bindings().map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    );
  }

  protected toggleTransform(index: number, value: string, checked: boolean) {
    this.bindingsChange.emit(
      this.bindings().map((row, i) => {
        if (i !== index) return row;
        const next = new Set(row.transforms);
        if (checked) next.add(value);
        else next.delete(value);
        return { ...row, transforms: CELL_TRANSFORMS.filter((item) => next.has(item)) };
      }),
    );
  }
}
