import { Routes } from '@angular/router';

const organizationOnboarding = () =>
    import('./views/organization-onboarding/organization-onboarding')
        .then(m => m.OrganizationOnboarding);

export const subscriptionRoutes: Routes = [
    { path: '', loadComponent: organizationOnboarding }
];