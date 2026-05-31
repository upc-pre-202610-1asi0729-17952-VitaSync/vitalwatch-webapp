import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { SubscriptionAccessService } from './subscription-access.service';

export const moduleAccessGuard: CanActivateFn = (route) => {
    const router = inject(Router);
    const subscriptionAccessService = inject(SubscriptionAccessService);

    const requiredModule = route.data?.['module'] as string | undefined;

    if (!requiredModule) return true;

    return subscriptionAccessService.loadCurrentPlan().pipe(
        map(plan => {
            if (!plan) {
                router.navigate(['/admin/subscription']);
                return false;
            }

            if (!plan.enabledModules.includes(requiredModule)) {
                router.navigate(['/admin/subscription']);
                return false;
            }

            return true;
        })
    );
};