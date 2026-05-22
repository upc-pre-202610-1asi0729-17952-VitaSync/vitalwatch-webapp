import {Component, inject} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'app-language-switcher',
  imports: [],
  templateUrl: './language-switcher.html',
  styleUrl: './language-switcher.css'
})
export class LanguageSwitcher {
  protected currentLang = 'es';
  protected languages = ['en', 'es'];

  private translate = inject(TranslateService);

  constructor() {
    this.currentLang = this.translate.getCurrentLang() || 'es';
  }

  protected useLanguage(language: string): void {
    this.translate.use(language);
    this.currentLang = language;
  }
}