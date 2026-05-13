import { Routes } from '@angular/router';

const iamRoutes = () =>
  import('./iam/presentation/iam.routes').then(m => m.iamRoutes);

export const routes: Routes = [
  { path: 'iam', loadChildren: iamRoutes },
  { path: '', redirectTo: 'iam/auth', pathMatch: 'full' },
  { path: '**', redirectTo: 'iam/auth' }
];
