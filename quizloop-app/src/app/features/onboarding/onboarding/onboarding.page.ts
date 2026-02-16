import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AnalyticsService } from 'src/app/core/services/analytics.service';

@Component({
    selector: 'app-onboarding',
    templateUrl: './onboarding.page.html',
    styleUrls: ['./onboarding.page.scss'],
    standalone: true,
    imports: [IonContent, CommonModule, TranslateModule]
})
export class OnboardingPage {
    private router = inject(Router);
    private analytics = inject(AnalyticsService);
    step = 1;

    nextStep() {
        if (this.step < 3) {
            this.step++;
        } else {
            void this.finish();
        }
    }

    async finish() {
        await this.analytics.logEvent('onboarding_complete');
        this.router.navigateByUrl('/home');
    }
}
