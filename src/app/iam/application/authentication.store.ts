import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationApi } from '../infrastructure/authentication-api';
import { SignInRequest } from '../infrastructure/request/sign-in-request';
import { AuthenticationSession } from '../domain/model/authentication-session.entity';
import { User, UserRole } from '../domain/model/user.entity';

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

    updateCurrentUser(user: User): void {
        const session = this.sessionSignal();

        if (!session) return;

        const updatedSession = new AuthenticationSession({
            token: session.token,
            user
        });

        this.sessionSignal.set(updatedSession);
        this.persistSession(updatedSession);
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
        sessionStorage.setItem('vitalwatch-session', JSON.stringify({
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
        const rawSession = sessionStorage.getItem('vitalwatch-session');

        if (!rawSession) return null;

        try {
            const parsed = JSON.parse(rawSession);

            const user = new User({
                id: parsed.user.id,
                organizationId: parsed.user.organizationId,
                firstName: parsed.user.firstName,
                lastName: parsed.user.lastName,
                email: parsed.user.email,
                role: parsed.user.role,
                status: parsed.user.status
            });

            return new AuthenticationSession({
                token: parsed.token,
                user
            });
        } catch {
            sessionStorage.removeItem('vitalwatch-session');
            return null;
        }
    }

    clearSession(): void {
        localStorage.removeItem('vitalwatch-session');
        sessionStorage.removeItem('vitalwatch-session');
        this.sessionSignal.set(null);
    }

    signOut(): void {
        this.clearSession();
        this.router.navigate(['/sign-in']).then();
    }
}