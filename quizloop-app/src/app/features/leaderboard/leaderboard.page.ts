import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton, IonButtons, IonSegment, IonSegmentButton, IonLabel, IonList } from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-leaderboard',
    templateUrl: './leaderboard.page.html',
    styleUrls: ['./leaderboard.page.scss'],
    standalone: true,
    imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton, IonButtons, IonSegment, IonSegmentButton, IonLabel, IonList, CommonModule, FormsModule, TranslateModule]
})
export class LeaderboardPage {
    category = 'daily';
}
