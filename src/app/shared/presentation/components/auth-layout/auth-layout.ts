import {Component, Input} from '@angular/core';
import {TranslatePipe} from '@ngx-translate/core';
import {LanguageSwitcher} from '../language-switcher/language-switcher';

@Component({
  selector: 'app-auth-layout',
  imports: [
    TranslatePipe,
    LanguageSwitcher
  ],
  templateUrl: './auth-layout.html',
  styleUrl: './auth-layout.css'
})
export class AuthLayout {
  @Input() variant: 'sign-in' | 'register' = 'sign-in';
}