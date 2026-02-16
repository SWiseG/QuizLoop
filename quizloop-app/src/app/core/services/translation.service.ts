import { Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class TranslationService {
    private readonly STORAGE_KEY = 'ql_language';
    readonly supportedLanguages = ['en-US', 'pt-BR'];
    currentLanguage = signal<string>('en-US');

    constructor(private translate: TranslateService) {
        this.translate.addLangs(this.supportedLanguages);
        this.translate.setDefaultLang('en-US');

        const saved = localStorage.getItem(this.STORAGE_KEY);
        const browserLang = navigator.language;
        const initial = saved || (browserLang.startsWith('pt') ? 'pt-BR' : 'en-US');

        this.setLanguage(initial);
    }

    setLanguage(lang: string) {
        const resolved = this.supportedLanguages.includes(lang) ? lang : 'en-US';
        this.translate.use(resolved);
        this.currentLanguage.set(resolved);
        localStorage.setItem(this.STORAGE_KEY, resolved);
    }
}
