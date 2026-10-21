import { Component, computed, effect, ElementRef, HostListener, inject, signal, viewChild } from '@angular/core';
import type { AssistantMessage, Message } from '@ag-ui/client';
import { CopilotKit, RenderToolCalls } from '@copilotkit/angular';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmTextarea } from '@spartan-ng/helm/textarea';
import { sendMessage } from '../core/ag-ui/send-message';
import { CUSTOMER_SEARCH_AGENT_ID, injectCustomerSearchAgentStore } from './customer-search-agent';

@Component({
  selector: 'ccdr-customer-chat',
  imports: [HlmButton, HlmTextarea, RenderToolCalls],
  template: `
    <div class="pointer-events-none fixed right-4 bottom-4 z-30 flex flex-col items-end gap-3">
      @if (open()) {
        <section
          class="bg-card text-card-foreground border-border pointer-events-auto flex max-h-[min(34rem,calc(100dvh-6.5rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-lg border shadow-2xl"
          role="dialog"
          aria-label="Ask CoreExtract"
        >
          <div class="h-1 shrink-0" style="background: var(--brand-core)"></div>
          <div class="border-border flex items-start justify-between gap-3 border-b px-4 py-3">
            <div>
              <h2 class="text-sm font-semibold">Ask CoreExtract</h2>
              <p class="text-muted-foreground text-xs">
                The answer updates the customer grid behind this panel.
              </p>
            </div>
            <button hlmBtn variant="ghost" size="xs" type="button" (click)="open.set(false)">Close</button>
          </div>
          <div class="grid min-h-0 flex-1 gap-3 overflow-y-auto px-4 py-3">
            <div #transcript class="grid gap-2" role="log" aria-live="polite" aria-relevant="additions">
              @for (message of visible(); track message.id) {
                @if (message.role === 'user') {
                  <div class="bg-primary text-primary-foreground ml-8 rounded-md px-3 py-2 text-sm">
                    {{ text(message) }}
                  </div>
                }
                @if (assistant(message); as reply) {
                  @if (text(reply)) {
                    <div class="bg-muted mr-8 rounded-md px-3 py-2 text-sm">{{ text(reply) }}</div>
                  }
                  @if (reply.toolCalls?.length) {
                    <copilot-render-tool-calls
                      [message]="reply"
                      [messages]="messages()"
                      [isLoading]="isRunning()"
                      [agentId]="agentId"
                    />
                  }
                }
              }
            </div>
            @if (error()) {
              <p class="text-destructive text-sm">{{ error() }}</p>
            }
          </div>
          <form class="border-border grid gap-2 border-t px-4 py-3" (submit)="onSubmit($event)">
            <label class="sr-only" for="customer-question">Question</label>
            <textarea
              #question
              hlmTextarea
              id="customer-question"
              rows="2"
              placeholder="Who are you looking for?"
              [value]="draft()"
              [disabled]="isRunning()"
              (input)="onDraft($event)"
              (keydown.enter)="onEnter($event)"
            ></textarea>
            <div class="flex items-center justify-between gap-2">
              <p class="text-muted-foreground text-xs">
                {{ isRunning() ? 'Updating the customer grid…' : 'Same filters as a saved search.' }}
              </p>
              <button hlmBtn size="sm" type="submit" [disabled]="isRunning() || !draft().trim()">
                {{ isRunning() ? 'Searching…' : 'Ask' }}
              </button>
            </div>
          </form>
        </section>
      }
      <button
        type="button"
        class="pointer-events-auto flex h-12 items-center gap-2 rounded-full px-4 text-sm font-medium text-white shadow-lg"
        style="background: var(--brand-core)"
        [attr.aria-expanded]="open()"
        (click)="open.set(!open())"
      >
        {{ open() ? 'Hide chat' : 'Ask CoreExtract' }}
      </button>
    </div>
  `,
})
export class CustomerChat {
  private readonly copilotKit = inject(CopilotKit);
  private readonly agentStore = injectCustomerSearchAgentStore();
  private readonly transcript = viewChild<ElementRef<HTMLElement>>('transcript');
  private readonly question = viewChild<ElementRef<HTMLTextAreaElement>>('question');
  protected readonly agentId = CUSTOMER_SEARCH_AGENT_ID;
  protected readonly open = signal(false);
  protected readonly messages = computed(() => this.agentStore().messages());
  protected readonly isRunning = computed(() => this.agentStore().isRunning());
  protected readonly visible = computed(() => this.messages().filter((message) => message.role !== 'tool'));
  protected readonly draft = signal('');
  protected readonly error = signal<string | null>(null);

  constructor() {
    effect(() => {
      this.visible();
      this.open();
      const element = this.transcript()?.nativeElement;
      if (!element) return;
      queueMicrotask(() => {
        element.scrollTop = element.scrollHeight;
      });
    });
    effect(() => {
      if (!this.open()) return;
      const field = this.question()?.nativeElement;
      if (!field) return;
      queueMicrotask(() => field.focus());
    });
  }

  @HostListener('document:keydown.escape')
  protected close() {
    this.open.set(false);
  }

  protected text(message: Message | AssistantMessage) {
    const content = message.content;
    if (typeof content === 'string') return content.trim();
    if (!Array.isArray(content)) return '';
    return content
      .map((part) => (part && typeof part === 'object' && 'text' in part ? String(part.text) : ''))
      .join('')
      .trim();
  }

  protected assistant(message: Message): AssistantMessage | null {
    return message.role === 'assistant' ? message : null;
  }

  protected onDraft(event: Event) {
    this.draft.set((event.target as HTMLTextAreaElement).value);
  }

  protected onEnter(event: Event) {
    const keyboard = event as KeyboardEvent;
    if (keyboard.shiftKey) return;
    keyboard.preventDefault();
    void this.submit();
  }

  protected onSubmit(event: Event) {
    event.preventDefault();
    void this.submit();
  }

  private async submit() {
    const content = this.draft().trim();
    if (!content || this.isRunning()) return;
    this.draft.set('');
    this.error.set(null);
    const before = this.messages().length;
    try {
      await sendMessage(this.copilotKit, this.agentStore, content);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'The search assistant failed.');
      return;
    }
    const answered = this.messages().slice(before).some((message) => message.role === 'assistant');
    if (!answered) {
      this.error.set('The search assistant did not answer. Run npm start so the AG-UI agent is available on port 4318.');
    }
  }
}
