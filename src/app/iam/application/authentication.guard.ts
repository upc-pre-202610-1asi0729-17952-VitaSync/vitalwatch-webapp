import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthenticationStore } from './authentication.store';
import { UserRole } from '../domain/model/user.entity';

const defaultRouteByRole: Record<UserRole, string> = {
    HOSPITAL_ADMIN: '/admin/dashboard',
    SUPERVISOR: '/supervisor/dashboard',
    DOCTOR: '/doctor/health'
};

export const authenticationGuard: CanActivateFn = () => {
    const store = inject(AuthenticationStore);
    const router = inject(Router);

    if (store.isSignedIn()) {
        return true;
    }

    return router.parseUrl('/sign-in');
};

export const roleGuard: CanActivateFn = route => {
    const store = inject(AuthenticationStore);
    const router = inject(Router);

    const user = store.currentUser();

    if (!user) {
        return router.parseUrl('/sign-in');
    }

    const allowedRoles = route.data['roles'] as UserRole[] | undefined;

    if (!allowedRoles || allowedRoles.includes(user.role)) {
        return true;
    }

    return router.parseUrl(defaultRouteByRole[user.role]);
};

export const publicOnlyGuard: CanActivateFn = () => {
    const store = inject(AuthenticationStore);
    const router = inject(Router);

    const user = store.currentUser();

    if (!user) {
        return true;
    }

    return router.parseUrl(defaultRouteByRole[user.role]);
};