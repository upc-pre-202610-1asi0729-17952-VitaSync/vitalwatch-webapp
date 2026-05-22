import {Routes} from '@angular/router';

const signIn = () => import('./views/sign-in/sign-in').then(m => m.SignIn);
const acceptInvitation = () => import('./views/accept-invitation/accept-invitation').then(m => m.AcceptInvitation);

export const iamRoutes: Routes = [
  { path: 'sign-in', loadComponent: signIn },
  { path: 'accept-invitation', loadComponent: acceptInvitation }
];