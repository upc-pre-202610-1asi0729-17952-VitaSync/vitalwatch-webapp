import { Routes } from '@angular/router';

const auth = () =>
  import('./views/auth/auth').then(m => m.Auth);

export const iamRoutes: Routes = [
  { path: 'auth', loadComponent: auth, title: 'VitalWatch - IAM' },
  { path: '', redirectTo: 'auth', pathMatch: 'full' }
];
