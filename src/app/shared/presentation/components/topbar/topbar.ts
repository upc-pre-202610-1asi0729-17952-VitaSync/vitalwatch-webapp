import { Component, Input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageSwitcher } from '../language-switcher/language-switcher';

@Component({
  selector: 'app-topbar',
  imports: [
    TranslatePipe,
    LanguageSwitcher
  ],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css'
})
export class Topbar {
  @Input({ required: true }) title = '';
  @Input({ required: true }) subtitle = '';
}