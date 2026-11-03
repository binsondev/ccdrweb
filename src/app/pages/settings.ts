import { Component, effect, inject, signal } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmInput } from '@spartan-ng/helm/input';
import { Api, apiMessage } from '../core/api';
import { AuthStore } from '../core/auth.store';
import { ChannelSettings } from '../core/whatsapp';
import { SettingsStore } from '../core/settings.store';
import { StatusBanner } from '../shared/status-banner';

@Component({
  selector: 'ccdr-settings',
  imports: [HlmButton, HlmInput, StatusBanner, ...HlmCardImports],
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

      @if (section() === 'commit') {
        <section hlmCard class="max-w-xl">
          <div hlmCardHeader>
            <h2 hlmCardTitle>Upload commit policy</h2>
            <p hlmCardDescription>
              Staged workbooks never write until someone commits. Choose whether a bad row blocks the
              rest of the file.
            </p>
          </div>
          <div hlmCardContent class="grid gap-3">
            @if (store.loading()) {
              <p class="text-muted-foreground text-sm">Loading settings…</p>
            } @else {
              <button
                type="button"
                class="rounded-md border px-4 py-3 text-left"
                [class.border-primary]="policy() === 'ValidOnly'"
                [class.bg-accent]="policy() === 'ValidOnly'"
                [class.border-border]="policy() !== 'ValidOnly'"
                [disabled]="!auth.canSettingsWrite()"
                (click)="policy.set('ValidOnly')"
              >
                <span class="block text-sm font-medium">Valid rows only</span>
                <span class="text-muted-foreground mt-1 block text-sm">
                  Commit writes good rows. Invalid rows stay in the batch for download.
                </span>
              </button>
              <button
                type="button"
                class="rounded-md border px-4 py-3 text-left"
                [class.border-primary]="policy() === 'AllOrNothing'"
                [class.bg-accent]="policy() === 'AllOrNothing'"
                [class.border-border]="policy() !== 'AllOrNothing'"
                [disabled]="!auth.canSettingsWrite()"
                (click)="policy.set('AllOrNothing')"
              >
                <span class="block text-sm font-medium">All or nothing</span>
                <span class="text-muted-foreground mt-1 block text-sm">
                  If any row fails, the registry does not change.
                </span>
              </button>
              @if (auth.canSettingsWrite()) {
                <button hlmBtn class="mt-1 w-fit" type="button" [disabled]="store.saving()" (click)="onSavePolicy()">
                  {{ store.saving() ? 'Saving…' : 'Save policy' }}
                </button>
              }
            }
          </div>
        </section>
      }

      @if (section() === 'sms') {
        <section hlmCard class="max-w-xl">
          <div hlmCardHeader>
            <h2 hlmCardTitle>SMS</h2>
            <p hlmCardDescription>
              Buzzify URL and key for this workspace. Sends with {{ channels()?.smsProvider || 'Stub' }} until both are set.
              Leave the key blank to keep the saved one.
            </p>
          </div>
          <form hlmCardContent class="grid gap-3" (submit)="saveChannels($event)">
            <label class="flex flex-col gap-1.5 text-sm font-medium">
              Base URL
              <input hlmInput [value]="smsBaseUrl()" [disabled]="!auth.canSettingsWrite()" (input)="smsBaseUrl.set(text($event))" />
            </label>
            <label class="flex flex-col gap-1.5 text-sm font-medium">
              API key
              <input
                hlmInput
                type="password"
                autocomplete="off"
                [value]="smsApiKey()"
                [disabled]="!auth.canSettingsWrite()"
                [placeholder]="channels()?.smsApiKeySet ? 'Saved key stays in place' : ''"
                (input)="smsApiKey.set(text($event))"
              />
            </label>
            @if (auth.canSettingsWrite()) {
              <button hlmBtn class="w-fit" type="submit" [disabled]="savingChannels()">
                {{ savingChannels() ? 'Saving…' : 'Save SMS' }}
              </button>
            }
          </form>
        </section>
      }

      @if (section() === 'email') {
        <section hlmCard class="max-w-xl">
          <div hlmCardHeader>
            <h2 hlmCardTitle>Email</h2>
            <p hlmCardDescription>
              SMTP relay for this workspace. Sends with {{ channels()?.emailProvider || 'Stub' }} until a host is set.
              Leave the password blank to keep the saved one.
            </p>
          </div>
          <form hlmCardContent class="grid gap-3" (submit)="saveChannels($event)">
            <label class="flex flex-col gap-1.5 text-sm font-medium">
              Host
              <input hlmInput [value]="emailHost()" [disabled]="!auth.canSettingsWrite()" (input)="emailHost.set(text($event))" />
            </label>
            <label class="flex flex-col gap-1.5 text-sm font-medium">
              Port
              <input hlmInput [value]="emailPort()" [disabled]="!auth.canSettingsWrite()" (input)="emailPort.set(text($event))" />
            </label>
            <label class="flex flex-col gap-1.5 text-sm font-medium">
              Username
              <input hlmInput [value]="emailUsername()" [disabled]="!auth.canSettingsWrite()" (input)="emailUsername.set(text($event))" />
            </label>
            <label class="flex flex-col gap-1.5 text-sm font-medium">
              Password
              <input
                hlmInput
                type="password"
                autocomplete="off"
                [value]="emailPassword()"
                [disabled]="!auth.canSettingsWrite()"
                [placeholder]="channels()?.emailPasswordSet ? 'Saved password stays in place' : ''"
                (input)="emailPassword.set(text($event))"
              />
            </label>
            <label class="flex flex-col gap-1.5 text-sm font-medium">
              From address
              <input hlmInput [value]="emailFromAddress()" [disabled]="!auth.canSettingsWrite()" (input)="emailFromAddress.set(text($event))" />
            </label>
            <label class="flex flex-col gap-1.5 text-sm font-medium">
              From name
              <input hlmInput [value]="emailFromName()" [disabled]="!auth.canSettingsWrite()" (input)="emailFromName.set(text($event))" />
            </label>
            @if (auth.canSettingsWrite()) {
              <button hlmBtn class="w-fit" type="submit" [disabled]="savingChannels()">
                {{ savingChannels() ? 'Saving…' : 'Save email' }}
              </button>
            }
          </form>
        </section>
      }

      @if (section() === 'whatsapp') {
        <section hlmCard class="max-w-xl">
          <div hlmCardHeader>
            <h2 hlmCardTitle>WhatsApp</h2>
            <p hlmCardDescription>
              Meta Cloud API for this workspace. Sends with {{ channels()?.whatsAppProvider || 'Stub' }} until a phone number ID and access token are set.
              The phone number ID is the numeric sender id from Meta, not the phone number. A 10-digit mobile is sent with the country code and no plus sign.
              Leave the token blank to keep the saved one.
            </p>
          </div>
          <form hlmCardContent class="grid gap-3" (submit)="saveChannels($event)">
            <label class="flex flex-col gap-1.5 text-sm font-medium">
              Phone number ID
              <input hlmInput [value]="whatsAppPhoneNumberId()" [disabled]="!auth.canSettingsWrite()" (input)="whatsAppPhoneNumberId.set(text($event))" />
            </label>
            <label class="flex flex-col gap-1.5 text-sm font-medium">
              Business account ID
              <input hlmInput [value]="whatsAppBusinessAccountId()" [disabled]="!auth.canSettingsWrite()" (input)="whatsAppBusinessAccountId.set(text($event))" />
            </label>
            <label class="flex flex-col gap-1.5 text-sm font-medium">
              Access token
              <input
                hlmInput
                type="password"
                autocomplete="off"
                [value]="whatsAppAccessToken()"
                [disabled]="!auth.canSettingsWrite()"
                [placeholder]="channels()?.whatsAppAccessTokenSet ? 'Saved token stays in place' : ''"
                (input)="whatsAppAccessToken.set(text($event))"
              />
            </label>
            <label class="flex flex-col gap-1.5 text-sm font-medium">
              Graph version
              <input hlmInput [value]="whatsAppGraphVersion()" [disabled]="!auth.canSettingsWrite()" (input)="whatsAppGraphVersion.set(text($event))" />
            </label>
            <label class="flex flex-col gap-1.5 text-sm font-medium">
              Country code
              <input hlmInput [value]="whatsAppCountryCode()" [disabled]="!auth.canSettingsWrite()" (input)="whatsAppCountryCode.set(text($event))" />
            </label>
            @if (auth.canSettingsWrite()) {
              <button hlmBtn class="w-fit" type="submit" [disabled]="savingChannels()">
                {{ savingChannels() ? 'Saving…' : 'Save WhatsApp' }}
              </button>
            }
          </form>
        </section>
      }
    </div>
  `,
})
export class SettingsPage {
  private readonly api = inject(Api);
  protected readonly auth = inject(AuthStore);
  protected readonly store = inject(SettingsStore);
  protected readonly tabs = [
    { id: 'commit' as const, label: 'Commit' },
    { id: 'sms' as const, label: 'SMS' },
    { id: 'email' as const, label: 'Email' },
    { id: 'whatsapp' as const, label: 'WhatsApp' },
  ];
  protected readonly section = signal<'commit' | 'sms' | 'email' | 'whatsapp'>('commit');
  protected readonly policy = signal<'ValidOnly' | 'AllOrNothing'>('ValidOnly');
  protected readonly error = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);
  protected readonly savingChannels = signal(false);
  protected readonly channels = signal<ChannelSettings | null>(null);
  protected readonly smsBaseUrl = signal('');
  protected readonly smsApiKey = signal('');
  protected readonly emailHost = signal('');
  protected readonly emailPort = signal('587');
  protected readonly emailUsername = signal('');
  protected readonly emailPassword = signal('');
  protected readonly emailFromAddress = signal('');
  protected readonly emailFromName = signal('');
  protected readonly whatsAppPhoneNumberId = signal('');
  protected readonly whatsAppBusinessAccountId = signal('');
  protected readonly whatsAppAccessToken = signal('');
  protected readonly whatsAppGraphVersion = signal('v25.0');
  protected readonly whatsAppCountryCode = signal('91');

  constructor() {
    effect(() => {
      if (this.auth.tenantSlug()) {
        void this.store.load();
        void this.loadChannels();
      }
    });
    effect(() => {
      const current = this.store.settings()?.uploadCommitPolicy;
      if (current) this.policy.set(current);
    });
    effect(() => {
      const storeError = this.store.error();
      const storeNotice = this.store.notice();
      if (storeError) this.error.set(storeError);
      if (storeNotice) this.notice.set(storeNotice);
    });
  }

  protected text(event: Event) {
    return (event.target as HTMLInputElement).value;
  }

  protected onSavePolicy() {
    void this.store.save(this.policy());
  }

  protected async saveChannels(event: Event) {
    event.preventDefault();
    if (!this.auth.canSettingsWrite()) return;
    this.savingChannels.set(true);
    this.error.set(null);
    this.notice.set(null);
    try {
      const saved = await this.api.saveChannelSettings({
        smsBaseUrl: this.smsBaseUrl().trim(),
        smsApiKey: this.smsApiKey().trim() ? this.smsApiKey().trim() : null,
        emailHost: this.emailHost().trim(),
        emailPort: Number(this.emailPort()) || 587,
        emailUsername: this.emailUsername().trim(),
        emailPassword: this.emailPassword() ? this.emailPassword() : null,
        emailFromAddress: this.emailFromAddress().trim(),
        emailFromName: this.emailFromName().trim(),
        whatsAppPhoneNumberId: this.whatsAppPhoneNumberId().trim(),
        whatsAppBusinessAccountId: this.whatsAppBusinessAccountId().trim(),
        whatsAppAccessToken: this.whatsAppAccessToken().trim() ? this.whatsAppAccessToken().trim() : null,
        whatsAppGraphVersion: this.whatsAppGraphVersion().trim(),
        whatsAppCountryCode: this.whatsAppCountryCode().trim(),
      });
      this.applyChannels(saved);
      this.smsApiKey.set('');
      this.emailPassword.set('');
      this.whatsAppAccessToken.set('');
      this.notice.set('Channel settings saved.');
    } catch (err) {
      this.error.set(apiMessage(err));
    } finally {
      this.savingChannels.set(false);
    }
  }

  private async loadChannels() {
    try {
      this.applyChannels(await this.api.channelSettings());
    } catch (err) {
      this.error.set(apiMessage(err));
    }
  }

  private applyChannels(saved: ChannelSettings) {
    this.channels.set(saved);
    this.smsBaseUrl.set(saved.smsBaseUrl ?? '');
    this.emailHost.set(saved.emailHost ?? '');
    this.emailPort.set(String(saved.emailPort || 587));
    this.emailUsername.set(saved.emailUsername ?? '');
    this.emailFromAddress.set(saved.emailFromAddress ?? '');
    this.emailFromName.set(saved.emailFromName ?? '');
    this.whatsAppPhoneNumberId.set(saved.whatsAppPhoneNumberId ?? '');
    this.whatsAppBusinessAccountId.set(saved.whatsAppBusinessAccountId ?? '');
    this.whatsAppGraphVersion.set(saved.whatsAppGraphVersion || 'v25.0');
    this.whatsAppCountryCode.set(saved.whatsAppCountryCode || '91');
  }
}
