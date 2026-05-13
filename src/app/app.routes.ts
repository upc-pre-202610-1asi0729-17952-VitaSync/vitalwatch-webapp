import { Routes } from '@angular/router';

const iamRoutes = () =>
  import('./iam/presentation/iam.routes').then(m => m.iamRoutes);

const medicalStaffRoutes = () =>
  import('./medical-staff/presentation/medical-staff.routes').then(m => m.medicalStaffRoutes);

export const routes: Routes = [
  { path: 'iam', loadChildren: iamRoutes },
  { path: 'medical-staff', loadChildren: medicalStaffRoutes },

  // Primero debe aparecer el login
  { path: '', redirectTo: 'iam/auth', pathMatch: 'full' },

  // Si la ruta no existe, vuelve al login
  { path: '**', redirectTo: 'iam/auth' }
];
