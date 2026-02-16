import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Question } from '../models/quiz.models';
import { environment } from 'src/environments/environment';
import { TranslationService } from './translation.service';

@Injectable({
    providedIn: 'root'
})
export class QuestionService {
    private apiUrl = `${environment.apiUrl}/questions`;
    private translationService = inject(TranslationService);

    constructor(private http: HttpClient) { }

    getQuestions(category?: string): Observable<Question[]> {
        let params = new HttpParams()
            .set('limit', '10')
            .set('locale', this.translationService.currentLanguage());

        const normalizedCategory = this.normalizeCategory(category);

        if (normalizedCategory) {
            params = params.set('category', normalizedCategory);
        }

        return this.http.get<Question[]>(this.apiUrl, { params });
    }

    private normalizeCategory(category?: string): string | null {
        if (!category) {
            return null;
        }

        const normalized = category.trim().toLowerCase();
        if (!normalized || normalized === 'daily' || normalized === 'classic') {
            return null;
        }

        return category.trim();
    }
}
