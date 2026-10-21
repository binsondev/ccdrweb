import { Component, computed, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import type { AssistantMessage, Message } from '@ag-ui/client';
import { CopilotKit, RenderToolCalls } from '@copilotkit/angular';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmTextarea } from '@spartan-ng/helm/textarea';
import { sendMessage } from '../core/ag-ui/send-message';
import { CUSTOMER_SEARCH_AGENT_ID, injectCustomerSearchAgentStore } from './customer-search-agent';

@Component({
  selector: 'ccdr-customer-chat',
  imports: [HlmButton, HlmTextarea, RenderToolCalls, ...HlmCardImports],
  template: `
    <section hlmCard class="overflow-hidden">
      <div class="h-1" style="background: var(--brand-core)"></div>
      <div hlmCardHeader class="border-border border-b">
        <h2 hlmCardTitle>Ask CoreExtract</h2>
        <p hlmCardDescription>
          Ask in plain language. Matching customers stay in this grid. The question becomes the same
          record type, text, and filters as a saved search.
        </p>
      </div>
      <div hlmCardContent class="grid gap-3 py-4">
        <div
          #transcript
          class="grid max-h-72 gap-2 overflow-y-auto"
          role="log"
          aria-live="polite"
          aria-relevant="additions"
        >
          @if (!visible().length) {
            <p class="text-muted-foreground text-sm">
              Try “seniors in ICU”, “patients named Sharma”, or “show everyone”.
            </p>
          }
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

        <div class="flex flex-wrap gap-1.5">
          @for (prompt of prompts; track prompt) {
            <button hlmBtn variant="outline" size="xs" type="button" [disabled]="isRunning()" (click)="ask(prompt)">
              {{ prompt }}
            </button>
          }
        </div>

        <form class="grid gap-2" (submit)="onSubmit($event)">
          <label class="sr-only" for="customer-question">Question</label>
          <textarea
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
              @if (isRunning()) {
                Updating the customer grid…
              } @else {
                Results use the customer search you already have.
              }
            </p>
            <button hlmBtn size="sm" type="submit" [disabled]="isRunning() || !draft().trim()">
              {{ isRunning() ? 'Searching…' : 'Ask' }}
            </button>
          </div>
        </form>
      </div>
    </section>
  `,
})
export class CustomerChat {
  private readonly copilotKit = inject(CopilotKit);
  private readonly agentStore = injectCustomerSearchAgentStore();
  private readonly transcript = viewChild<ElementRef<HTMLElement>>('transcript');
  protected readonly agentId = CUSTOMER_SEARCH_AGENT_ID;
  protected readonly messages = computed(() => this.agentStore().messages());
  protected readonly isRunning = computed(() => this.agentStore().isRunning());
  protected readonly visible = computed(() => this.messages().filter((message) => message.role !== 'tool'));
  protected readonly draft = signal('');
  protected readonly error = signal<string | null>(null);
  protected readonly prompts = ['Seniors in ICU', 'Show everyone', 'Clear filters'];

  constructor() {
    effect(() => {
      this.visible();
      const element = this.transcript()?.nativeElement;
      if (!element) return;
      queueMicrotask(() => {
        element.scrollTop = element.scrollHeight;
      });
    });
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

  protected ask(prompt: string) {
    this.draft.set(prompt);
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
