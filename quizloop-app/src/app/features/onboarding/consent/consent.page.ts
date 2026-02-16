import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ConsentService } from '../../../core/services/consent.service';

@Component({
    selector: 'app-consent',
    templateUrl: './consent.page.html',
    styleUrls: ['./consent.page.scss'],
    standalone: true,
    imports: [IonContent, CommonModule, TranslateModule]
})
export class ConsentPage {
    private router = inject(Router);
    private consentService = inject(ConsentService);

    accept() {
        this.consentService.accept();
        this.router.navigateByUrl('/onboarding');
    }

    decline() {
        this.consentService.decline();
        this.router.navigateByUrl('/onboarding');
    }
}
