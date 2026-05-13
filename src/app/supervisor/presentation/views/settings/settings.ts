import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { IamStore } from '../../../../iam/application/iam.store';

type LanguageCode = 'es' | 'en';

@Component({
  selector: 'app-settings',
  imports: [TranslatePipe],
  templateUrl: './settings.html',
  styleUrl: './settings.css'
})
export class Settings {
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly iamStore = inject(IamStore);

  protected readonly selectedLanguage = signal<LanguageCode>(
    (localStorage.getItem('vitalwatch-language') as LanguageCode) ?? 'es'
  );

  protected readonly feedbackMessage = signal<string | null>(null);

  protected readonly profile = {
    name: 'Figma Supervisor',
    roleKey: 'supervisor.settings.supervisorRole',
    positionKey: 'supervisor.settings.supervisorPosition',
    hospitalUnit: 'Emergencias',
    email: 'figsup@hospital.com',
    lastAccess: '12/05/2026 08:32:21'
  };

  protected changeLanguage(language: LanguageCode): void {
    this.selectedLanguage.set(language);
    localStorage.setItem('vitalwatch-language', language);
    this.translate.use(language);
  }

  protected changePassword(): void {
    this.feedbackMessage.set(
      this.translate.instant('supervisor.settings.passwordFeatureMessage')
    );
  }

  protected logout(): void {
    this.iamStore.signOut();
    this.router.navigate(['/iam/auth']).then();
  }
}
