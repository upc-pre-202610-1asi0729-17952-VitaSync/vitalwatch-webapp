import { Routes } from '@angular/router';

const iamRoutes = () =>
  import('./iam/presentation/iam.routes').then(m => m.iamRoutes);

const medicalStaffRoutes = () =>
  import('./medical-staff/presentation/medical-staff.routes').then(m => m.medicalStaffRoutes);

const supervisorRoutes = () =>
  import('./supervisor/presentation/supervisor.routes').then(m => m.supervisorRoutes);

export const routes: Routes = [
  { path: 'iam', loadChildren: iamRoutes },
  { path: 'medical-staff', loadChildren: medicalStaffRoutes },
  { path: 'supervisor', loadChildren: supervisorRoutes },

  { path: '', redirectTo: 'iam/auth', pathMatch: 'full' },
  { path: '**', redirectTo: 'iam/auth' }
];
