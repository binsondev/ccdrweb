import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { Api, apiMessage } from '../core/api';
import { CustomersStore, type SearchCriteria } from '../core/customers.store';
import { SmsCategory, SmsJob, SmsPreview, SmsTemplate, smsPlaceholders } from '../core/sms';

@Component({
  selector: 'ccdr-sms-wizard',
  imports: [HlmButton, HlmInput, RouterLink],
  template: `
    <div class="fixed inset-0 z-40 bg-foreground/25" (click)="closed.emit()"></div>
    <section
      class="bg-card text-card-foreground border-border fixed top-6 right-4 bottom-6 z-50 flex w-[min(32rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-lg border shadow-2xl"
      role="dialog"
      aria-label="Send SMS"
    >
      <div class="h-1 shrink-0" style="background: var(--brand-core)"></div>
      <div class="border-border flex items-start justify-between gap-3 border-b px-4 py-3">
        <div>
          <h2 class="text-sm font-semibold">Send SMS</h2>
          <p class="text-muted-foreground text-xs">Step {{ step() }} of 5. Delivery reports stay in the provider portal.</p>
        </div>
        <button hlmBtn variant="ghost" size="xs" type="button" (click)="closed.emit()">Close</button>
      </div>
      <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
        @if (error()) {
          <p class="text-destructive text-sm">{{ error() }}</p>
        }
        @if (step() === 1) {
          <label class="flex flex-col gap-1.5 text-sm font-medium">
            Category
            <select hlmInput [value]="categoryId()" (change)="onCategory($event)">
              <option value="">Choose a category</option>
              @for (category of activeCategories(); track category.id) {
                <option [value]="category.id">{{ category.name }}</option>
              }
            </select>
          </label>
          <label class="flex flex-col gap-1.5 text-sm font-medium">
            Template
            <select hlmInput [value]="templateId()" (change)="onTemplate($event)">
              <option value="">Choose a template</option>
              @for (template of templatesForCategory(); track template.id) {
                <option [value]="template.id">{{ template.name }}</option>
              }
            </select>
          </label>
          @if (selectedTemplate(); as template) {
            <p class="bg-muted rounded-md px-3 py-2 text-sm whitespace-pre-wrap">{{ template.body }}</p>
          }
        }
        @if (step() === 2) {
          <fieldset class="grid gap-2">
            <legend class="text-sm font-medium">Phone attributes</legend>
            <p class="text-muted-foreground text-xs">The first field with a value is the mobile number.</p>
            @for (attr of phoneAttributes(); track attr.recordType + ':' + attr.code) {
              <label class="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  [checked]="phones().includes(attr.code)"
                  (change)="togglePhone(attr.code, $event)"
                />
                {{ attr.label }}
                <span class="text-muted-foreground">{{ attr.code }}</span>
              </label>
            } @empty {
              <p class="text-muted-foreground text-sm">No phone or text attributes are active for this search.</p>
            }
          </fieldset>
          @for (name of placeholders(); track name) {
            <label class="flex flex-col gap-1.5 text-sm font-medium">
              {{ '{' + name + '}' }}
              <select hlmInput [value]="mappings()[name] ?? ''" (change)="mapVar(name, $event)">
                <option value="">Leave blank</option>
                @for (attr of textAttributes(); track attr.recordType + ':' + attr.code) {
                  <option [value]="attr.code">{{ attr.label }}</option>
                }
              </select>
            </label>
          }
        }
        @if (step() === 3) {
          <p class="text-sm">
            {{
              customerIds().length === 1
                ? '1 selected record'
                : customerIds().length
                  ? customerIds().length + ' selected records'
                  : 'Everyone in the current search'
            }}
          </p>
          @if (preview(); as result) {
            <p class="text-sm">
              {{ result.eligible }} ready to send.
              {{ result.skippedNoPhone }} missing a number,
              {{ result.skippedInvalid }} invalid.
            </p>
            @if (result.overCap) {
              <p class="text-destructive text-sm">
                {{ result.requested }} people is over the {{ result.maxRecipients }} limit.
              </p>
            }
            @for (sample of result.samples; track sample.customerId) {
              <p class="bg-muted rounded-md px-3 py-2 text-sm">
                <span class="font-medium">{{ sample.phone }}</span>
                {{ sample.body }}
              </p>
            }
          }
        }
        @if (step() === 4) {
          <p class="text-sm">
            Provider
            <span class="font-medium">{{ providerName() || 'Not configured' }}</span>
          </p>
          <p class="text-muted-foreground text-sm">
            CoreExtract records that the batch was submitted. Open the provider portal for delivery status.
          </p>
        }
        @if (step() === 5 && job(); as sent) {
          <p class="text-sm">Job {{ sent.id }} is {{ sent.status }}.</p>
          <a class="text-sm underline" routerLink="/app/sms">Open SMS jobs</a>
        }
      </div>
      <div class="border-border flex justify-between gap-2 border-t px-4 py-3">
        <button hlmBtn variant="outline" size="sm" type="button" [disabled]="step() === 1 || busy()" (click)="back()">
          Back
        </button>
        @if (step() < 5) {
          <button hlmBtn size="sm" type="button" [disabled]="busy()" (click)="next()">
            {{ step() === 4 ? (busy() ? 'Sending…' : 'Send') : step() === 3 ? 'Continue' : 'Next' }}
          </button>
        }
      </div>
    </section>
  `,
})
export class SmsWizard {
  private readonly api = inject(Api);
  private readonly customers = inject(CustomersStore);
  readonly criteria = input.required<SearchCriteria>();
  readonly savedSearchId = input<string | null>(null);
  readonly customerIds = input<string[]>([]);
  readonly closed = output<void>();

  protected readonly step = signal(1);
  protected readonly error = signal<string | null>(null);
  protected readonly busy = signal(false);
  protected readonly categories = signal<SmsCategory[]>([]);
  protected readonly templates = signal<SmsTemplate[]>([]);
  protected readonly categoryId = signal('');
  protected readonly templateId = signal('');
  protected readonly phones = signal<string[]>([]);
  protected readonly mappings = signal<Record<string, string>>({});
  protected readonly preview = signal<SmsPreview | null>(null);
  protected readonly providerName = signal('');
  protected readonly job = signal<SmsJob | null>(null);

  protected readonly activeCategories = computed(() => this.categories().filter((item) => item.isActive));
  protected readonly templatesForCategory = computed(() =>
    this.templates().filter((item) => item.isActive && item.categoryId === this.categoryId()),
  );
  protected readonly selectedTemplate = computed(
    () => this.templates().find((item) => item.id === this.templateId()) ?? null,
  );
  protected readonly placeholders = computed(() => smsPlaceholders(this.selectedTemplate()?.body ?? ''));
  protected readonly textAttributes = computed(() => {
    const type = this.criteria().recordType;
    const types = new Set(['Phone', 'Text', 'Email', 'Multiline']);
    return this.customers
      .attributes()
      .filter((attr) => attr.active && types.has(attr.dataType))
      .filter((attr) => !type || attr.recordType === type);
  });
  protected readonly phoneAttributes = computed(() =>
    this.textAttributes().filter((attr) => attr.dataType === 'Phone' || attr.dataType === 'Text'),
  );

  constructor() {
    effect(() => {
      void this.load();
    });
  }

  private async load() {
    try {
      const [categories, templates, providers] = await Promise.all([
        this.api.smsCategories(),
        this.api.smsTemplates(),
        this.api.smsProviders(),
      ]);
      this.categories.set(categories);
      this.templates.set(templates);
      this.providerName.set(providers.active);
    } catch (err) {
      this.error.set(apiMessage(err));
    }
  }

  protected onCategory(event: Event) {
    this.categoryId.set((event.target as HTMLSelectElement).value);
    this.templateId.set('');
  }

  protected onTemplate(event: Event) {
    this.templateId.set((event.target as HTMLSelectElement).value);
  }

  protected togglePhone(code: string, event: Event) {
    const on = (event.target as HTMLInputElement).checked;
    this.phones.update((codes) => (on ? [...codes, code] : codes.filter((item) => item !== code)));
  }

  protected mapVar(name: string, event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.mappings.update((current) => ({ ...current, [name]: value }));
  }

  protected back() {
    this.error.set(null);
    this.step.update((value) => Math.max(1, value - 1));
  }

  protected async next() {
    this.error.set(null);
    if (this.step() === 1) {
      if (!this.templateId()) {
        this.error.set('Choose a template.');
        return;
      }
      this.step.set(2);
      return;
    }
    if (this.step() === 2 && !this.phones().length) {
      this.error.set('Choose a phone attribute.');
      return;
    }
    if (this.step() === 2) {
      this.step.set(3);
      await this.runPreview();
      return;
    }
    if (this.step() === 3) {
      if (!this.preview() || this.preview()?.overCap || this.preview()?.eligible === 0) {
        this.error.set('Nothing is ready to send.');
        return;
      }
      this.step.set(4);
      return;
    }
    if (this.step() === 4) {
      await this.send();
    }
  }

  private requestBody() {
    const criteria = this.criteria();
    const ids = this.customerIds();
    return {
      templateId: this.templateId(),
      phoneAttributeCodes: this.phones(),
      variableMappings: this.mappings(),
      savedSearchId: ids.length ? null : this.savedSearchId(),
      recordType: criteria.recordType || null,
      q: criteria.q || null,
      filter: criteria.filter,
      customerIds: ids,
    };
  }

  private async runPreview() {
    this.busy.set(true);
    try {
      this.preview.set(await this.api.previewSmsJob(this.requestBody()));
    } catch (err) {
      this.error.set(apiMessage(err));
    } finally {
      this.busy.set(false);
    }
  }

  private async send() {
    this.busy.set(true);
    try {
      const job = await this.api.createSmsJob(this.requestBody());
      this.job.set(job);
      this.step.set(5);
    } catch (err) {
      this.error.set(apiMessage(err));
    } finally {
      this.busy.set(false);
    }
  }
}
