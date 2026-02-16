import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton, IonButtons } from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { AnalyticsService } from 'src/app/core/services/analytics.service';

@Component({
    selector: 'app-premium',
    templateUrl: './premium.page.html',
    styleUrls: ['./premium.page.scss'],
    standalone: true,
    imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton, IonButtons, CommonModule, TranslateModule]
})
export class PremiumPage {
    private analytics = inject(AnalyticsService);

    buy(plan: string) {
        void this.analytics.logEvent('purchase_started', { plan_type: plan });
        // TODO: Integrate Capacitor IAP plugin.
        console.log('Purchasing plan:', plan);
    }

}
