import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from 'src/app/core/services/auth.service';
import { AnalyticsService } from 'src/app/core/services/analytics.service';
import { AdService } from 'src/app/core/services/ad.service';
import { ConsentService } from 'src/app/core/services/consent.service';

@Component({
    selector: 'app-splash',
    templateUrl: './splash.page.html',
    styleUrls: ['./splash.page.scss'],
    standalone: true,
    imports: [IonContent, CommonModule, TranslateModule]
})
export class SplashPage {
    private router = inject(Router);
    private auth = inject(AuthService);
    private analytics = inject(AnalyticsService);
    private adService = inject(AdService);
    private consentService = inject(ConsentService);

    constructor() {
        void this.initApp();
    }

    private async initApp(): Promise<void> {
        await this.auth.initialize();
        await this.adService.initialize();
        await this.analytics.logEvent('app_open');

        setTimeout(() => {
            const target = this.consentService.hasConsented() ? '/home' : '/consent';
            this.router.navigateByUrl(target);
        }, 1500);
    }
}
