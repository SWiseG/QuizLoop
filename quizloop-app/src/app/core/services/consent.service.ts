import { Injectable, signal } from '@angular/core';

export type ConsentStatus = 'unknown' | 'accepted' | 'declined';

@Injectable({ providedIn: 'root' })
export class ConsentService {
    private readonly STORAGE_KEY = 'ql_consent';
    consentStatus = signal<ConsentStatus>(this.loadConsent());

    accept(): void {
        this.consentStatus.set('accepted');
        localStorage.setItem(this.STORAGE_KEY, 'accepted');
    }

    decline(): void {
        this.consentStatus.set('declined');
        localStorage.setItem(this.STORAGE_KEY, 'declined');
    }

    hasConsented(): boolean {
        return this.consentStatus() === 'accepted';
    }

    private loadConsent(): ConsentStatus {
        return (localStorage.getItem(this.STORAGE_KEY) as ConsentStatus) ?? 'unknown';
    }
}
