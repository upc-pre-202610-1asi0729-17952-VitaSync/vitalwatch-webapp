import { Routes } from '@angular/router';

import { moduleAccessGuard } from '../../subscription-plan-management/application/module-access.guard';

export const adminShiftCoordinationRoutes: Routes = [
    {
        path: 'teams',
        loadComponent: () =>
            import('./views/team-management/team-management')
                .then(m => m.TeamManagement)
    }
];

export const supervisorShiftCoordinationRoutes: Routes = [
    {
        path: 'shifts',
        canActivate: [moduleAccessGuard],
        data: {
            module: 'SHIFT_MANAGEMENT'
        },
        loadComponent: () =>
            import('./views/supervisor-shifts/supervisor-shifts')
                .then(m => m.SupervisorShifts)
    }
];

export const doctorShiftCoordinationRoutes: Routes = [
    {
        path: 'shifts',
        loadComponent: () =>
            import('./views/doctor-shifts/doctor-shifts')
                .then(m => m.DoctorShifts)
    }
];