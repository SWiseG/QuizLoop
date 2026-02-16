import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton, IonButtons, IonGrid, IonRow, IonCol } from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { UserProfileService } from '../../core/services/user-profile.service';

@Component({
    selector: 'app-profile',
    templateUrl: './profile.page.html',
    styleUrls: ['./profile.page.scss'],
    standalone: true,
    imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton, IonButtons, IonGrid, IonRow, IonCol, CommonModule, TranslateModule]
})
export class ProfilePage {
    private userProfileService = inject(UserProfileService);

    user = this.userProfileService.userProfile;
    initials = computed(() => this.getInitials(this.user().id));
    level = computed(() => Math.max(1, Math.floor(this.user().totalGames / 10) + 1));

    private getInitials(userId: string): string {
        const parts = userId
            .replace(/[^a-zA-Z0-9]+/g, ' ')
            .trim()
            .split(' ')
            .filter(Boolean);

        if (parts.length === 0) {
            return 'PL';
        }

        if (parts.length === 1) {
            return parts[0].slice(0, 2).toUpperCase();
        }

        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
}
