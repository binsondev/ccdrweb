import { Component, inject, signal } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { Api, apiMessage } from '../core/api';
import { AuthStore } from '../core/auth.store';
import { WhatsAppCategory, WhatsAppJob, WhatsAppTemplate } from '../core/whatsapp';
import { StatusBanner } from '../shared/status-banner';

@Component({
  selector: 'ccdr-whatsapp-page',
  imports: [HlmButton, HlmInput, StatusBanner, ...HlmCardImports, ...HlmTableImports],
  template: `
    <div class="grid gap-6">
      <div class="flex flex-wrap gap-2">
        @for (tab of tabs; track tab.id) {
          <button
            hlmBtn
            size="sm"
            type="button"
            [variant]="section() === tab.id ? 'default' : 'outline'"
            (click)="section.set(tab.id)"
          >
            {{ tab.label }}
          </button>
        }
      </div>
      <ccdr-status [error]="error()" [notice]="notice()" />

      @if (section() === 'categories') {
        <section hlmCard>
          <div hlmCardHeader>
            <h2 hlmCardTitle>Categories</h2>
            <p hlmCardDescription>Tenant names for kinds of WhatsApp messages.</p>
          </div>
          <div hlmCardContent class="grid gap-4">
            @if (auth.canCatalogWrite()) {
              <form class="grid gap-3 md:grid-cols-[1fr_1fr_auto]" (submit)="saveCategory($event)">
                <input hlmInput name="name" placeholder="Name" [value]="categoryName()" (input)="categoryName.set(inputValue($event))" />
                <input hlmInput name="description" placeholder="Description" [value]="categoryDescription()" (input)="categoryDescription.set(inputValue($event))" />
                <button hlmBtn size="sm" type="submit">{{ editingCategory() ? 'Update' : 'Add' }}</button>
              </form>
            }
            <div hlmTableContainer>
              <table hlmTable>
                <thead hlmTHead>
                  <tr hlmTr>
                    <th hlmTh>Name</th>
                    <th hlmTh>Description</th>
                    <th hlmTh></th>
                  </tr>
                </thead>
                <tbody hlmTBody>
                  @for (category of categories(); track category.id) {
                    <tr hlmTr>
                      <td hlmTd>{{ category.name }}</td>
                      <td hlmTd>{{ category.description }}</td>
                      <td hlmTd class="text-right">
                        @if (auth.canCatalogWrite()) {
                          <button hlmBtn variant="ghost" size="xs" type="button" (click)="editCategory(category)">Edit</button>
                          <button hlmBtn variant="ghost" size="xs" type="button" (click)="removeCategory(category)">Delete</button>
                        }
                      </td>
                    </tr>
                  } @empty {
                    <tr hlmTr>
                      <td hlmTd colspan="3" class="text-muted-foreground">No categories yet.</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </section>
      }

      @if (section() === 'templates') {
        <section hlmCard>
          <div hlmCardHeader>
            <h2 hlmCardTitle>Templates</h2>
            <p hlmCardDescription>
              Meta delivers an approved template. Wrap a name in curly braces. CoreExtract turns those into numbered parameters, in the order they appear, and submits the template when Settings has a business account and token.
            </p>
          </div>
          <div hlmCardContent class="grid gap-4">
            @if (auth.canCatalogWrite()) {
              <form class="grid gap-3 md:grid-cols-2" (submit)="saveTemplate($event)">
                <label class="flex flex-col gap-1.5 text-sm font-medium">
                  Category
                  <select hlmInput [value]="templateCategoryId()" (change)="templateCategoryId.set(selectValue($event))">
                    <option value="">Category</option>
                    @for (category of categories(); track category.id) {
                      <option [value]="category.id">{{ category.name }}</option>
                    }
                  </select>
                </label>
                <label class="flex flex-col gap-1.5 text-sm font-medium">
                  Template name
                  <input hlmInput [value]="templateName()" (input)="templateName.set(inputValue($event))" placeholder="Template name" />
                </label>
                <label class="flex flex-col gap-1.5 text-sm font-medium">
                  Meta template name
                  <input hlmInput [value]="metaTemplateName()" (input)="metaTemplateName.set(inputValue($event))" placeholder="visit_reminder" />
                </label>
                <label class="flex flex-col gap-1.5 text-sm font-medium">
                  Language
                  <input hlmInput [value]="language()" (input)="language.set(inputValue($event))" placeholder="en" />
                </label>
                <label class="flex flex-col gap-1.5 text-sm font-medium">
                  Meta category
                  <select hlmInput [value]="metaCategory()" (change)="metaCategory.set(selectValue($event))">
                    <option value="UTILITY">Utility</option>
                    <option value="MARKETING">Marketing</option>
                  </select>
                </label>
                <label class="flex flex-col gap-1.5 text-sm font-medium md:col-span-2">
                  Message body
                  <textarea hlmInput rows="4" [value]="templateBody()" (input)="templateBody.set(inputValue($event))" placeholder="Message body"></textarea>
                </label>
                <label class="flex flex-col gap-1.5 text-sm font-medium md:col-span-2">
                  Footer
                  <input hlmInput [value]="footer()" (input)="footer.set(inputValue($event))" placeholder="Footer, 60 characters, no placeholders" />
                </label>
                <button hlmBtn size="sm" class="w-fit" type="submit">{{ editingTemplate() ? 'Update template' : 'Add template' }}</button>
              </form>
            }
            <div hlmTableContainer>
              <table hlmTable>
                <thead hlmTHead>
                  <tr hlmTr>
                    <th hlmTh>Name</th>
                    <th hlmTh>Meta name</th>
                    <th hlmTh>Status</th>
                    <th hlmTh></th>
                  </tr>
                </thead>
                <tbody hlmTBody>
                  @for (template of templates(); track template.id) {
                    <tr hlmTr>
                      <td hlmTd>{{ template.name }}</td>
                      <td hlmTd>{{ template.metaTemplateName }}</td>
                      <td hlmTd>{{ template.providerStatus }}</td>
                      <td hlmTd class="text-right">
                        @if (auth.canCatalogWrite()) {
                          <button hlmBtn variant="ghost" size="xs" type="button" (click)="editTemplate(template)">Edit</button>
                          <button hlmBtn variant="ghost" size="xs" type="button" (click)="removeTemplate(template)">Delete</button>
                        }
                      </td>
                    </tr>
                  } @empty {
                    <tr hlmTr>
                      <td hlmTd colspan="4" class="text-muted-foreground">No templates yet.</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </section>
      }

      @if (section() === 'jobs') {
        <section hlmCard>
          <div hlmCardHeader>
            <h2 hlmCardTitle>Jobs</h2>
            <p hlmCardDescription>Submission counts only. Delivery stays with WhatsApp.</p>
          </div>
          <div hlmCardContent>
            <div hlmTableContainer>
              <table hlmTable>
                <thead hlmTHead>
                  <tr hlmTr>
                    <th hlmTh>When</th>
                    <th hlmTh>Template</th>
                    <th hlmTh>Status</th>
                    <th hlmTh>Submitted</th>
                    <th hlmTh>Provider</th>
                  </tr>
                </thead>
                <tbody hlmTBody>
                  @for (job of jobs(); track job.id) {
                    <tr hlmTr>
                      <td hlmTd>{{ job.createdAt.slice(0, 16).replace('T', ' ') }}</td>
                      <td hlmTd>{{ job.templateName }}</td>
                      <td hlmTd>{{ job.status }}</td>
                      <td hlmTd>{{ job.submitted }} / {{ job.requested }}</td>
                      <td hlmTd>{{ job.providerKey }}</td>
                    </tr>
                  } @empty {
                    <tr hlmTr>
                      <td hlmTd colspan="5" class="text-muted-foreground">No jobs yet.</td>
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
export class WhatsAppPage {
  private readonly api = inject(Api);
  protected readonly auth = inject(AuthStore);
  protected readonly tabs = [
    { id: 'categories' as const, label: 'Categories' },
    { id: 'templates' as const, label: 'Templates' },
    { id: 'jobs' as const, label: 'Jobs' },
  ];
  protected readonly section = signal<'categories' | 'templates' | 'jobs'>('categories');
  protected readonly error = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);
  protected readonly categories = signal<WhatsAppCategory[]>([]);
  protected readonly templates = signal<WhatsAppTemplate[]>([]);
  protected readonly jobs = signal<WhatsAppJob[]>([]);
  protected readonly categoryName = signal('');
  protected readonly categoryDescription = signal('');
  protected readonly editingCategory = signal<string | null>(null);
  protected readonly templateCategoryId = signal('');
  protected readonly templateName = signal('');
  protected readonly metaTemplateName = signal('');
  protected readonly language = signal('en');
  protected readonly metaCategory = signal('UTILITY');
  protected readonly templateBody = signal('');
  protected readonly footer = signal('');
  protected readonly editingTemplate = signal<string | null>(null);

  constructor() {
    void this.reload();
  }

  protected inputValue(event: Event) {
    return (event.target as HTMLInputElement | HTMLTextAreaElement).value;
  }

  protected selectValue(event: Event) {
    return (event.target as HTMLSelectElement).value;
  }

  protected editCategory(category: WhatsAppCategory) {
    this.editingCategory.set(category.id);
    this.categoryName.set(category.name);
    this.categoryDescription.set(category.description ?? '');
  }

  protected editTemplate(template: WhatsAppTemplate) {
    this.editingTemplate.set(template.id);
    this.templateCategoryId.set(template.categoryId);
    this.templateName.set(template.name);
    this.metaTemplateName.set(template.metaTemplateName);
    this.language.set(template.language);
    this.metaCategory.set(template.metaCategory);
    this.templateBody.set(template.body);
    this.footer.set(template.footer ?? '');
  }

  protected async saveCategory(event: Event) {
    event.preventDefault();
    this.error.set(null);
    try {
      const name = this.categoryName().trim();
      const description = this.categoryDescription().trim() || null;
      const editing = this.editingCategory();
      if (editing) {
        const current = this.categories().find((item) => item.id === editing);
        await this.api.updateWhatsAppCategory({
          id: editing,
          name,
          description,
          isActive: current?.isActive ?? true,
          createdAt: current?.createdAt ?? '',
          updatedAt: current?.updatedAt ?? '',
        });
      } else {
        await this.api.createWhatsAppCategory({ name, description, isActive: true });
      }
      this.editingCategory.set(null);
      this.categoryName.set('');
      this.categoryDescription.set('');
      this.notice.set('Category saved.');
      await this.reload();
    } catch (err) {
      this.error.set(apiMessage(err));
    }
  }

  protected async removeCategory(category: WhatsAppCategory) {
    this.error.set(null);
    try {
      await this.api.deleteWhatsAppCategory(category.id);
      await this.reload();
    } catch (err) {
      this.error.set(apiMessage(err));
    }
  }

  protected async saveTemplate(event: Event) {
    event.preventDefault();
    this.error.set(null);
    try {
      const editing = this.editingTemplate();
      const fields = {
        categoryId: this.templateCategoryId(),
        name: this.templateName().trim(),
        metaTemplateName: this.metaTemplateName().trim() || null,
        language: this.language().trim() || 'en',
        metaCategory: this.metaCategory(),
        body: this.templateBody().trim(),
        footer: this.footer().trim() || null,
        isActive: true,
      };
      if (editing) {
        const current = this.templates().find((item) => item.id === editing);
        await this.api.updateWhatsAppTemplate({
          ...fields,
          metaTemplateName: fields.metaTemplateName ?? current?.metaTemplateName ?? '',
          id: editing,
          providerStatus: current?.providerStatus ?? null,
          createdAt: current?.createdAt ?? '',
          updatedAt: current?.updatedAt ?? '',
        });
      } else {
        await this.api.createWhatsAppTemplate(fields);
      }
      this.editingTemplate.set(null);
      this.templateName.set('');
      this.metaTemplateName.set('');
      this.templateBody.set('');
      this.footer.set('');
      this.notice.set('Template saved.');
      await this.reload();
    } catch (err) {
      this.error.set(apiMessage(err));
    }
  }

  protected async removeTemplate(template: WhatsAppTemplate) {
    this.error.set(null);
    try {
      await this.api.deleteWhatsAppTemplate(template.id);
      await this.reload();
    } catch (err) {
      this.error.set(apiMessage(err));
    }
  }

  private async reload() {
    try {
      const [categories, templates, jobs] = await Promise.all([
        this.api.whatsAppCategories(),
        this.api.whatsAppTemplates(),
        this.api.whatsAppJobs(),
      ]);
      this.categories.set(categories);
      this.templates.set(templates);
      this.jobs.set(jobs);
    } catch (err) {
      this.error.set(apiMessage(err));
    }
  }
}
