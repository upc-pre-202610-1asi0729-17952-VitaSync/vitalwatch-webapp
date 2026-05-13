import { Routes } from '@angular/router';
import { MedicalStaffLayout } from './layouts/medical-staff-layout/medical-staff-layout';

const myStatus = () =>
  import('./views/my-status/my-status').then(m => m.MyStatus);

const myAlerts = () =>
  import('./views/my-alerts/my-alerts').then(m => m.MyAlerts);

const myHistory = () =>
  import('./views/my-history/my-history').then(m => m.MyHistory);

const recovery = () =>
  import('./views/recovery/recovery').then(m => m.Recovery);

const settings = () =>
  import('./views/settings/settings').then(m => m.Settings);

export const medicalStaffRoutes: Routes = [
  {
    path: '',
    component: MedicalStaffLayout,
    children: [
      { path: 'my-status', loadComponent: myStatus, title: 'VitalWatch - My Status' },
      { path: 'my-alerts', loadComponent: myAlerts, title: 'VitalWatch - My Alerts' },
      { path: 'my-history', loadComponent: myHistory, title: 'VitalWatch - My History' },
      { path: 'recovery', loadComponent: recovery, title: 'VitalWatch - Recovery' },
      { path: 'settings', loadComponent: settings, title: 'VitalWatch - Settings' },
      { path: '', redirectTo: 'my-status', pathMatch: 'full' }
    ]
  }
];
