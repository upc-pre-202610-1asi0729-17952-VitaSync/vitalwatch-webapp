import { Routes } from '@angular/router';

export const adminShiftCoordinationRoutes: Routes = [
    {
        path: 'teams',
        loadComponent: () =>
            import('./views/team-management/team-management')
                .then(m => m.TeamManagement)
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