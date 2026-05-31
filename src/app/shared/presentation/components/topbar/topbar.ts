import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthenticationStore } from '../../../../iam/application/authentication.store';
import { LanguageSwitcher } from '../language-switcher/language-switcher';

type UserRole = 'HOSPITAL_ADMIN' | 'SUPERVISOR' | 'DOCTOR';

@Component({
  selector: 'app-topbar',
  imports: [
    TranslatePipe,
    LanguageSwitcher
  ],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css'
})
export class Topbar implements OnInit {
  private authenticationStore = inject(AuthenticationStore);

  protected currentUser = computed(() =>
    this.authenticationStore.currentUser()
  );

  protected greetingKey = signal('layout.topbar.greetings.default.hello');

  protected greetingParams = computed(() => ({
    name: this.currentUser()?.firstName ?? this.currentUser()?.fullName ?? 'usuario'
  }));

  private readonly adminGreetingKeys = [
    'layout.topbar.greetings.admin.manage-today',
    'layout.topbar.greetings.admin.review-operation',
    'layout.topbar.greetings.admin.panel-ready',
    'layout.topbar.greetings.admin.staff-and-reports',
    'layout.topbar.greetings.admin.center-status'
  ];

  private readonly supervisorGreetingKeys = [
    'layout.topbar.greetings.supervisor.review-team',
    'layout.topbar.greetings.supervisor.alerts-and-risks',
    'layout.topbar.greetings.supervisor.care-team',
    'layout.topbar.greetings.supervisor.quick-review',
    'layout.topbar.greetings.supervisor.preventive-work'
  ];

  private readonly doctorGreetingKeys = [
    'layout.topbar.greetings.doctor.how-is-shift',
    'layout.topbar.greetings.doctor.review-status',
    'layout.topbar.greetings.doctor.care-rhythm',
    'layout.topbar.greetings.doctor.indicators-ready',
    'layout.topbar.greetings.doctor.recovery-status'
  ];

  private readonly fallbackGreetingKeys = [
    'layout.topbar.greetings.default.hello',
    'layout.topbar.greetings.default.ready',
    'layout.topbar.greetings.default.continue'
  ];

  ngOnInit(): void {
    this.setRandomGreeting();
  }

  private setRandomGreeting(): void {
    const user = this.currentUser();

    if (!user) {
      this.greetingKey.set(this.getRandomKey(this.fallbackGreetingKeys));
      return;
    }

    const keys = this.getGreetingKeysByRole(user.role as UserRole);
    this.greetingKey.set(this.getRandomKey(keys));
  }

  private getGreetingKeysByRole(role: UserRole): string[] {
    const greetings: Record<UserRole, string[]> = {
      HOSPITAL_ADMIN: this.adminGreetingKeys,
      SUPERVISOR: this.supervisorGreetingKeys,
      DOCTOR: this.doctorGreetingKeys
    };

    return greetings[role] ?? this.fallbackGreetingKeys;
  }

  private getRandomKey(keys: string[]): string {
    const randomIndex = Math.floor(Math.random() * keys.length);
    return keys[randomIndex];
  }
}