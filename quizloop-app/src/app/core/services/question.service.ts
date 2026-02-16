import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Question } from '../models/quiz.models';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root'
})
export class QuestionService {
    private apiUrl = `${environment.apiUrl}/questions`;

    constructor(private http: HttpClient) { }

    getQuestions(category?: string): Observable<Question[]> {
        // TODO: Switch to live API when backend is running
        // return this.http.get<Question[]>(this.apiUrl, { params: category ? { category } : {} });

        const allQuestions: Question[] = [
            { id: '1', category: 'Science', text: 'Which planet is known as the Red Planet?', options: ['Venus', 'Jupiter', 'Mars', 'Saturn'], correctIndex: 2, difficulty: 'Easy', explanation: 'Mars appears red due to iron oxide on its surface.' },
            { id: '2', category: 'History', text: 'In which year did World War II end?', options: ['1943', '1944', '1945', '1946'], correctIndex: 2, difficulty: 'Medium', explanation: 'WWII ended on September 2, 1945.' },
            { id: '3', category: 'Sports', text: 'Which country won the FIFA World Cup in 2022?', options: ['France', 'Argentina', 'Brazil', 'Germany'], correctIndex: 1, difficulty: 'Easy', explanation: 'Argentina won their 3rd World Cup title in Qatar 2022.' },
            { id: '4', category: 'Geography', text: 'What is the smallest country in the world?', options: ['Monaco', 'Vatican City', 'San Marino', 'Liechtenstein'], correctIndex: 1, difficulty: 'Easy', explanation: 'Vatican City is only 0.44 km², making it the smallest country.' },
            { id: '5', category: 'Science', text: 'What is the chemical symbol for gold?', options: ['Go', 'Gd', 'Au', 'Ag'], correctIndex: 2, difficulty: 'Easy', explanation: 'Au comes from the Latin word "aurum".' },
            { id: '6', category: 'History', text: 'Who painted the Mona Lisa?', options: ['Michelangelo', 'Raphael', 'Leonardo da Vinci', 'Donatello'], correctIndex: 2, difficulty: 'Easy', explanation: 'Leonardo da Vinci painted it between 1503 and 1519.' },
            { id: '7', category: 'Science', text: 'What is the hardest natural substance on Earth?', options: ['Titanium', 'Diamond', 'Quartz', 'Obsidian'], correctIndex: 1, difficulty: 'Medium', explanation: 'Diamond scores 10 on the Mohs hardness scale.' },
            { id: '8', category: 'Geography', text: 'Which river is the longest in the world?', options: ['Amazon', 'Nile', 'Yangtze', 'Mississippi'], correctIndex: 1, difficulty: 'Medium', explanation: 'The Nile stretches about 6,650 km through northeastern Africa.' },
            { id: '9', category: 'Technology', text: 'Who co-founded Apple Inc.?', options: ['Bill Gates', 'Mark Zuckerberg', 'Steve Jobs', 'Jeff Bezos'], correctIndex: 2, difficulty: 'Easy', explanation: 'Steve Jobs co-founded Apple with Steve Wozniak and Ronald Wayne in 1976.' },
            { id: '10', category: 'Science', text: 'What gas do plants primarily absorb from the atmosphere?', options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'], correctIndex: 2, difficulty: 'Easy', explanation: 'Plants absorb CO₂ during photosynthesis to produce glucose and oxygen.' },
        ];

        // Filter by category if provided
        const filtered = category && category !== 'Daily' && category !== 'daily' && category !== 'classic'
            ? allQuestions.filter(q => q.category.toLowerCase() === category.toLowerCase())
            : allQuestions;

        // Shuffle and return up to 10
        const shuffled = [...filtered].sort(() => Math.random() - 0.5);
        return of(shuffled.slice(0, 10));
    }
}
