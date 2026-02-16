import { Component, effect, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { TranslationService } from './core/services/translation.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  private readonly translationService = inject(TranslationService);

  constructor() {
    effect(() => {
      document.documentElement.lang = this.translationService.currentLanguage();
    });
  }
}
