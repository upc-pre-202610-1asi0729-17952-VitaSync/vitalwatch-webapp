import {Routes} from '@angular/router';

const iamRoutes = () => import('./iam/presentation/iam.routes').then(m => m.iamRoutes);

export const routes: Routes = [
  { path: '', redirectTo: 'sign-in', pathMatch: 'full' },
  { path: '', loadChildren: iamRoutes },
  { path: '**', redirectTo: 'sign-in' }
];