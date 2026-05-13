import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly translate = inject(TranslateService);

  constructor() {
    this.translate.addLangs(['es', 'en']);

    const savedLanguage = localStorage.getItem('vitalwatch-language') ?? 'es';
    this.translate.use(savedLanguage);
  }
}
