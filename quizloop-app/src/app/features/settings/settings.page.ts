import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton, IonButtons, IonList, IonToggle } from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { TranslationService } from '../../core/services/translation.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-settings',
    templateUrl: './settings.page.html',
    styleUrls: ['./settings.page.scss'],
    standalone: true,
    imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton, IonButtons, IonList, IonToggle, CommonModule, FormsModule, TranslateModule]
})
export class SettingsPage {
    private translationService = inject(TranslationService);
    private router = inject(Router);

    currentLanguageName = computed(() => {
        return this.translationService.currentLanguage() === 'pt-BR' ? 'Português (BR)' : 'English (US)'
    });

    toggleLanguage() {
        const current = this.translationService.currentLanguage();
        this.translationService.setLanguage(current === 'en-US' ? 'pt-BR' : 'en-US');
    }

    goToPrivacy() {
        this.router.navigateByUrl('/privacy-policy');
    }

    goToTerms() {
        this.router.navigateByUrl('/terms');
    }

    requestDataDeletion() {
        // TODO: Implement data deletion trigger (Firebase function or support email)
        window.open('mailto:privacy@quizloop.app?subject=Data Deletion Request');
    }
}
