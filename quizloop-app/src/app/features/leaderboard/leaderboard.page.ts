import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton, IonButtons, IonSegment, IonSegmentButton, IonLabel, IonList } from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-leaderboard',
    templateUrl: './leaderboard.page.html',
    styleUrls: ['./leaderboard.page.scss'],
    standalone: true,
    imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton, IonButtons, IonSegment, IonSegmentButton, IonLabel, IonList, CommonModule, FormsModule, TranslateModule]
})
export class LeaderboardPage {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/leaderboard`;

    category: LeaderboardPeriod = 'daily';
    entries = signal<LeaderboardEntry[]>([]);
    isLoading = signal(false);

    topThree = computed(() => this.entries().slice(0, 3));
    remainingEntries = computed(() => this.entries().slice(3));

    constructor() {
        void this.loadLeaderboard();
    }

    onCategoryChange() {
        void this.loadLeaderboard();
    }

    formatTopLabel(index: number): string {
        const entry = this.topThree()[index];
        return entry ? `#${entry.rank} ${entry.userId}` : '-';
    }

    private async loadLeaderboard(): Promise<void> {
        this.isLoading.set(true);

        try {
            const data = await firstValueFrom(
                this.http.get<LeaderboardEntry[]>(this.apiUrl, {
                    params: { period: this.category }
                })
            );
            this.entries.set(data);
        } catch {
            this.entries.set([]);
        } finally {
            this.isLoading.set(false);
        }
    }
}

type LeaderboardPeriod = 'daily' | 'weekly' | 'alltime';

interface LeaderboardEntry {
    rank: number;
    userId: string;
    totalScore: number;
    gamesPlayed: number;
}
