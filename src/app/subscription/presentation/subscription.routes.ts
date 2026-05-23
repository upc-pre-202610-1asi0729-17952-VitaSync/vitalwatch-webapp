import { Routes } from '@angular/router';

const organizationOnboarding = () =>
    import('./views/organization-onboarding/organization-onboarding')
        .then(m => m.OrganizationOnboarding);

const checkoutPayment = () =>
    import('./views/checkout-payment/checkout-payment')
        .then(m => m.CheckoutPayment);

const onboardingSuccess = () =>
    import('./views/onboarding-success/onboarding-success')
        .then(m => m.OnboardingSuccess);

export const subscriptionRoutes: Routes = [
    { path: '', loadComponent: organizationOnboarding },
    { path: 'checkout/:id', loadComponent: checkoutPayment },
    { path: 'success', loadComponent: onboardingSuccess }
];