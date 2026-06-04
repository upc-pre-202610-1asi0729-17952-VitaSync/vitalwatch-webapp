import { Routes } from '@angular/router';
import { moduleAccessGuard } from '../../subscription-plan-management/application/module-access.guard';

export const supervisorStaffRecoveryRoutes: Routes = [
    {
        path: 'preventive-actions',
        canActivate: [moduleAccessGuard],
        data: {
            module: 'PREVENTIVE_ACTIONS'
        },
        loadComponent: () =>
            import('./views/preventive-actions-management/preventive-actions-management')
                .then(m => m.PreventiveActionsManagement)
    }
];

export const doctorStaffRecoveryRoutes: Routes = [
    {
        path: 'recovery',
        loadComponent: () =>
            import('./views/doctor-recovery/doctor-recovery')
                .then(m => m.DoctorRecovery)
    }
];