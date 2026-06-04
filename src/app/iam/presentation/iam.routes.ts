import { Routes } from '@angular/router';
import { publicOnlyGuard } from '../application/authentication.guard';

const signIn = () =>
  import('./views/sign-in/sign-in')
    .then(m => m.SignIn);

const acceptInvitation = () =>
  import('./views/accept-invitation/accept-invitation')
    .then(m => m.AcceptInvitation);

const staffManagement = () =>
  import('./views/staff-management/staff-management')
    .then(m => m.StaffManagement);

const invitationManagement = () =>
  import('./views/invitation-management/invitation-management')
    .then(m => m.InvitationManagement);

const accountSettings = () =>
  import('./views/account-settings/account-settings')
    .then(m => m.AccountSettings);

export const iamRoutes: Routes = [
  {
    path: 'sign-in',
    canActivate: [publicOnlyGuard],
    loadComponent: signIn
  },
  {
    path: 'accept-invitation',
    loadComponent: acceptInvitation
  }
];

export const adminIamRoutes: Routes = [
  {
    path: 'staff',
    loadComponent: staffManagement
  },
  {
    path: 'invitations',
    loadComponent: invitationManagement
  },
  {
    path: 'settings',
    loadComponent: accountSettings
  }
];

export const supervisorIamRoutes: Routes = [
  {
    path: 'settings',
    loadComponent: accountSettings
  }
];

export const doctorIamRoutes: Routes = [
  {
    path: 'settings',
    loadComponent: accountSettings
  }
];