import { TestBed } from '@angular/core/testing';
import { ConsentService } from './consent.service';

describe('ConsentService', () => {
    beforeEach(() => {
        localStorage.clear();
        TestBed.configureTestingModule({
            providers: [ConsentService]
        });
    });

    it('defaults to unknown status on fresh start', () => {
        const service = TestBed.inject(ConsentService);

        expect(service.consentStatus()).toBe('unknown');
    });

    it('accept sets status to accepted and persists to localStorage', () => {
        const service = TestBed.inject(ConsentService);

        service.accept();

        expect(service.consentStatus()).toBe('accepted');
        expect(localStorage.getItem('ql_consent')).toBe('accepted');
    });

    it('decline sets status to declined and persists to localStorage', () => {
        const service = TestBed.inject(ConsentService);

        service.decline();

        expect(service.consentStatus()).toBe('declined');
        expect(localStorage.getItem('ql_consent')).toBe('declined');
    });

    it('hasConsented returns true only when status is accepted', () => {
        const service = TestBed.inject(ConsentService);

        expect(service.hasConsented()).toBeFalse();

        service.decline();
        expect(service.hasConsented()).toBeFalse();

        service.accept();
        expect(service.hasConsented()).toBeTrue();
    });

    it('loads persisted consent status from localStorage on creation', () => {
        localStorage.setItem('ql_consent', 'accepted');

        const service = TestBed.inject(ConsentService);

        expect(service.consentStatus()).toBe('accepted');
    });
});
