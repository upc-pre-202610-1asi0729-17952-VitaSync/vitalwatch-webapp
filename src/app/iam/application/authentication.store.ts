import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationApi } from '../infrastructure/authentication-api';
import { SignInRequest } from '../infrastructure/sign-in-request';
import { AuthenticationSession } from '../domain/model/authentication-session.entity';
import { UserRole } from '../domain/model/user.entity';

@Injectable({
    providedIn: 'root'
})
export class AuthenticationStore {
    private authenticationApi = inject(AuthenticationApi);
    private router = inject(Router);

    private sessionSignal = signal<AuthenticationSession | null>(this.restoreSession());
    private loadingSignal = signal(false);
    private errorSignal = signal<string | null>(null);

    readonly session = this.sessionSignal.asReadonly();
    readonly loading = this.loadingSignal.asReadonly();
    readonly error = this.errorSignal.asReadonly();

    readonly isSignedIn = computed(() => this.sessionSignal() !== null);
    readonly currentUser = computed(() => this.sessionSignal()?.user ?? null);

    signIn(request: SignInRequest): void {
        this.loadingSignal.set(true);
        this.errorSignal.set(null);

        this.authenticationApi.signIn(request).subscribe({
            next: session => {
                this.sessionSignal.set(session);
                this.persistSession(session);
                this.loadingSignal.set(false);
                this.router.navigate([this.getDefaultRouteByRole(session.user.role)]).then();
            },
            error: () => {
                this.errorSignal.set('auth.error.invalid-credentials');
                this.loadingSignal.set(false);
            }
        });
    }

    signOut(): void {
        localStorage.removeItem('vitalwatch-session');
        this.sessionSignal.set(null);
        this.router.navigate(['/sign-in']).then();
    }

    private getDefaultRouteByRole(role: UserRole): string {
        const routes: Record<UserRole, string> = {
            HOSPITAL_ADMIN: '/admin/dashboard',
            SUPERVISOR: '/supervisor/dashboard',
            DOCTOR: '/doctor/health'
        };

        return routes[role];
    }

    private persistSession(session: AuthenticationSession): void {
        localStorage.setItem('vitalwatch-session', JSON.stringify({
            token: session.token,
            user: {
                id: session.user.id,
                organizationId: session.user.organizationId,
                firstName: session.user.firstName,
                lastName: session.user.lastName,
                email: session.user.email,
                role: session.user.role,
                status: session.user.status
            }
        }));
    }

    private restoreSession(): AuthenticationSession | null {
        const rawSession = localStorage.getItem('vitalwatch-session');

        if (!rawSession) return null;

        const parsed = JSON.parse(rawSession);

        return new AuthenticationSession({
            token: parsed.token,
            user: parsed.user
        });
    }
}