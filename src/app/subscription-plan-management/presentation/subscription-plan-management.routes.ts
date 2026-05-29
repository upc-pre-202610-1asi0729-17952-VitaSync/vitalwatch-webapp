import { Routes } from '@angular/router';

export const subscriptionPlanManagementRoutes: Routes = [
    {
        path: '',
        redirectTo: 'professional',
        pathMatch: 'full'
    },
    {
        path: 'success',
        loadComponent: () =>
            import('./views/checkout-success/checkout-success')
                .then(m => m.CheckoutSuccess)
    },
    {
        path: 'cancelled',
        loadComponent: () =>
            import('./views/checkout-cancelled/checkout-cancelled')
                .then(m => m.CheckoutCancelled)
    },
    {
        path: ':planCode',
        loadComponent: () =>
            import('./views/organization-registration/organization-registration')
                .then(m => m.OrganizationRegistration)
    },
    {
        path: '**',
        redirectTo: 'professional'
    }
];