import { Component, computed, inject, signal } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { Api, apiMessage } from '../core/api';
import { AuthStore } from '../core/auth.store';
import { EmailCategory, EmailJob, EmailTemplate } from '../core/email';
import { StatusBanner } from '../shared/status-banner';

@Component({
  selector: 'ccdr-email-page',
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
            <p hlmCardDescription>Tenant names for kinds of email. They are not a fixed promo list.</p>
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
            <p hlmCardDescription>Subject and body are plain text. Wrap a name in curly braces to fill it from an attribute at send time. A footer is appended after the body.</p>
          </div>
          <div hlmCardContent class="grid gap-4">
            @if (auth.canCatalogWrite()) {
              <form class="grid gap-3" (submit)="saveTemplate($event)">
                <div class="grid gap-3 md:grid-cols-2">
                  <select hlmInput [value]="templateCategoryId()" (change)="templateCategoryId.set(selectValue($event))">
                    <option value="">Category</option>
                    @for (category of categories(); track category.id) {
                      <option [value]="category.id">{{ category.name }}</option>
                    }
                  </select>
                  <input hlmInput placeholder="Template name" [value]="templateName()" (input)="templateName.set(inputValue($event))" />
                  <input hlmInput placeholder="Subject" [value]="subject()" (input)="subject.set(inputValue($event))" />
                  <input hlmInput placeholder="From name" [value]="fromName()" (input)="fromName.set(inputValue($event))" />
                  <input hlmInput class="md:col-span-2" placeholder="From address, optional" [value]="fromAddress()" (input)="fromAddress.set(inputValue($event))" />
                </div>
                <textarea
                  hlmInput
                  rows="4"
                  placeholder="Message body"
                  [value]="templateBody()"
                  (input)="templateBody.set(inputValue($event))"
                ></textarea>
                <textarea
                  hlmInput
                  rows="2"
                  placeholder="Footer, such as an unsubscribe line"
                  [value]="footer()"
                  (input)="footer.set(inputValue($event))"
                ></textarea>
                <button hlmBtn size="sm" class="justify-self-start" type="submit">
                  {{ editingTemplate() ? 'Update template' : 'Add template' }}
                </button>
              </form>
            }
            <div hlmTableContainer>
              <table hlmTable>
                <thead hlmTHead>
                  <tr hlmTr>
                    <th hlmTh>Name</th>
                    <th hlmTh>Category</th>
                    <th hlmTh>Subject</th>
                    <th hlmTh></th>
                  </tr>
                </thead>
                <tbody hlmTBody>
                  @for (template of templates(); track template.id) {
                    <tr hlmTr>
                      <td hlmTd>{{ template.name }}</td>
                      <td hlmTd>{{ categoryLabel(template.categoryId) }}</td>
                      <td hlmTd class="max-w-xs truncate">{{ template.subject }}</td>
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
            <p hlmCardDescription>Submission counts only. Delivery stays with the mail host.</p>
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
                      <td hlmTd>{{ job.status }}{{ job.error ? ' — ' + job.error : '' }}</td>
                      <td hlmTd>{{ job.submitted }} / {{ job.requested }}</td>
                      <td hlmTd>{{ job.providerKey }}</td>
                    </tr>
                  } @empty {
                    <tr hlmTr>
                      <td hlmTd colspan="5" class="text-muted-foreground">No email jobs yet.</td>
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
export class EmailPage {
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
  protected readonly categories = signal<EmailCategory[]>([]);
  protected readonly templates = signal<EmailTemplate[]>([]);
  protected readonly jobs = signal<EmailJob[]>([]);
  protected readonly categoryName = signal('');
  protected readonly categoryDescription = signal('');
  protected readonly editingCategory = signal<string | null>(null);
  protected readonly templateCategoryId = signal('');
  protected readonly templateName = signal('');
  protected readonly subject = signal('');
  protected readonly fromName = signal('');
  protected readonly fromAddress = signal('');
  protected readonly templateBody = signal('');
  protected readonly footer = signal('');
  protected readonly editingTemplate = signal<string | null>(null);
  protected readonly categoryNameOf = computed(() => new Map(this.categories().map((item) => [item.id, item.name])));

  constructor() {
    void this.reload();
  }

  protected categoryLabel(id: string) {
    return this.categoryNameOf().get(id) ?? '';
  }

  protected inputValue(event: Event) {
    return (event.target as HTMLInputElement | HTMLTextAreaElement).value;
  }

  protected selectValue(event: Event) {
    return (event.target as HTMLSelectElement).value;
  }

  protected editCategory(category: EmailCategory) {
    this.editingCategory.set(category.id);
    this.categoryName.set(category.name);
    this.categoryDescription.set(category.description ?? '');
  }

  protected editTemplate(template: EmailTemplate) {
    this.editingTemplate.set(template.id);
    this.templateCategoryId.set(template.categoryId);
    this.templateName.set(template.name);
    this.subject.set(template.subject);
    this.fromName.set(template.fromName ?? '');
    this.fromAddress.set(template.fromAddress ?? '');
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
        await this.api.updateEmailCategory({
          id: editing,
          name,
          description,
          isActive: current?.isActive ?? true,
          createdAt: current?.createdAt ?? '',
          updatedAt: current?.updatedAt ?? '',
        });
      } else {
        await this.api.createEmailCategory({ name, description, isActive: true });
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

  protected async removeCategory(category: EmailCategory) {
    this.error.set(null);
    try {
      await this.api.deleteEmailCategory(category.id);
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
        subject: this.subject().trim(),
        body: this.templateBody().trim(),
        fromName: this.fromName().trim() || null,
        fromAddress: this.fromAddress().trim() || null,
        footer: this.footer().trim() || null,
        isActive: true,
      };
      if (editing) {
        const current = this.templates().find((item) => item.id === editing);
        await this.api.updateEmailTemplate({
          ...fields,
          id: editing,
          createdAt: current?.createdAt ?? '',
          updatedAt: current?.updatedAt ?? '',
        });
      } else {
        await this.api.createEmailTemplate(fields);
      }
      this.editingTemplate.set(null);
      this.templateName.set('');
      this.subject.set('');
      this.templateBody.set('');
      this.fromName.set('');
      this.fromAddress.set('');
      this.footer.set('');
      this.notice.set('Template saved.');
      await this.reload();
    } catch (err) {
      this.error.set(apiMessage(err));
    }
  }

  protected async removeTemplate(template: EmailTemplate) {
    this.error.set(null);
    try {
      await this.api.deleteEmailTemplate(template.id);
      await this.reload();
    } catch (err) {
      this.error.set(apiMessage(err));
    }
  }

  private async reload() {
    try {
      const [categories, templates, jobs] = await Promise.all([
        this.api.emailCategories(),
        this.api.emailTemplates(),
        this.api.emailJobs(),
      ]);
      this.categories.set(categories);
      this.templates.set(templates);
      this.jobs.set(jobs);
    } catch (err) {
      this.error.set(apiMessage(err));
    }
  }
}
