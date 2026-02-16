import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { TranslationService } from './translation.service';

describe('TranslationService', () => {
    let translateSpy: jasmine.SpyObj<TranslateService>;

    function configureTestBed(): void {
        translateSpy = jasmine.createSpyObj<TranslateService>('TranslateService', ['addLangs', 'setDefaultLang', 'use']);
        TestBed.configureTestingModule({
            providers: [
                TranslationService,
                { provide: TranslateService, useValue: translateSpy }
            ]
        });
    }

    beforeEach(() => {
        localStorage.clear();
        TestBed.resetTestingModule();
    });

    it('setLanguage("pt-BR") updates signal and persists to localStorage', () => {
        configureTestBed();
        const service = TestBed.inject(TranslationService);

        service.setLanguage('pt-BR');

        expect(service.currentLanguage()).toBe('pt-BR');
        expect(localStorage.getItem('ql_language')).toBe('pt-BR');
        expect(translateSpy.use).toHaveBeenCalledWith('pt-BR');
    });

    it('setLanguage("invalid") falls back to en-US', () => {
        configureTestBed();
        const service = TestBed.inject(TranslationService);

        service.setLanguage('invalid');

        expect(service.currentLanguage()).toBe('en-US');
        expect(localStorage.getItem('ql_language')).toBe('en-US');
        expect(translateSpy.use).toHaveBeenCalledWith('en-US');
    });

    it('reads persisted language from localStorage on creation', () => {
        localStorage.setItem('ql_language', 'pt-BR');
        configureTestBed();

        const service = TestBed.inject(TranslationService);

        expect(service.currentLanguage()).toBe('pt-BR');
        expect(translateSpy.addLangs).toHaveBeenCalledWith(['en-US', 'pt-BR']);
        expect(translateSpy.setDefaultLang).toHaveBeenCalledWith('en-US');
        expect(translateSpy.use).toHaveBeenCalledWith('pt-BR');
    });

    it('detects browser language on creation when no saved language exists', () => {
        spyOnProperty(window.navigator, 'language', 'get').and.returnValue('pt-PT');
        configureTestBed();

        const service = TestBed.inject(TranslationService);

        expect(service.currentLanguage()).toBe('pt-BR');
        expect(localStorage.getItem('ql_language')).toBe('pt-BR');
        expect(translateSpy.use).toHaveBeenCalledWith('pt-BR');
    });
});
