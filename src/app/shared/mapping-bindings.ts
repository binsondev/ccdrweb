import { Component, computed, input, output } from '@angular/core';
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
            <label class="grid gap-1 text-sm">
              <select
                hlmInput
                [value]="selectValue(row)"
                (change)="setField(i, 'attributeCode', $event)"
              >
                <option value="">Choose attribute</option>
                @if (orphanedCode(row); as orphan) {
                  <option [value]="orphan" [selected]="true">{{ orphan }}</option>
                }
                @for (attr of attributes(); track attr.recordType + ':' + attr.code) {
                  <option [value]="attr.code" [selected]="attr.code === row.attributeCode">
                    {{ attr.label }} ({{ attr.code }})
                  </option>
                }
              </select>
              @if (attributeLabel(row.attributeCode); as label) {
                <span class="text-muted-foreground text-xs">Bound to {{ label }}</span>
              }
            </label>
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
  private readonly codes = computed(
    () => new Set(this.attributes().map((attr) => attr.code.toLowerCase())),
  );

  protected selectValue(row: MappingBindingDraft) {
    // Re-apply the value only after options exist so the native select
    // does not stick on the placeholder.
    return this.attributes().length ? row.attributeCode : '';
  }

  protected orphanedCode(row: MappingBindingDraft) {
    const code = row.attributeCode.trim();
    if (!code || !this.attributes().length) return null;
    return this.codes().has(code.toLowerCase()) ? null : code;
  }

  protected attributeLabel(code: string) {
    if (!code) return null;
    const attr = this.attributes().find((item) => item.code === code);
    return attr ? `${attr.label} (${attr.code})` : code;
  }

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
