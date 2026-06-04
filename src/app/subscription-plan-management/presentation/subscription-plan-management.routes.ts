import { Routes } from '@angular/router';

const checkoutSuccess = () =>
    import('./views/checkout-success/checkout-success')
        .then(m => m.CheckoutSuccess);

const checkoutCancelled = () =>
    import('./views/checkout-cancelled/checkout-cancelled')
        .then(m => m.CheckoutCancelled);

const organizationRegistration = () =>
    import('./views/organization-registration/organization-registration')
        .then(m => m.OrganizationRegistration);

const adminSubscription = () =>
    import('./views/admin-subscription/admin-subscription')
        .then(m => m.AdminSubscription);

export const subscriptionPlanManagementRoutes: Routes = [
    {
        path: '',
        redirectTo: 'professional',
        pathMatch: 'full'
    },
    {
        path: 'success',
        loadComponent: checkoutSuccess
    },
    {
        path: 'cancelled',
        loadComponent: checkoutCancelled
    },
    {
        path: ':planCode',
        loadComponent: organizationRegistration
    },
    {
        path: '**',
        redirectTo: 'professional'
    }
];

export const adminSubscriptionPlanManagementRoutes: Routes = [
    {
        path: 'subscription',
        loadComponent: adminSubscription
    }
];