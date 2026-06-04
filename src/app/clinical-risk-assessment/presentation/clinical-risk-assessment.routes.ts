import { Routes } from '@angular/router';

export const adminClinicalRiskAssessmentRoutes: Routes = [
    {
        path: 'dashboard',
        loadComponent: () =>
            import('./views/admin-dashboard/admin-dashboard')
                .then(m => m.AdminDashboard)
    }
];

export const supervisorClinicalRiskAssessmentRoutes: Routes = [
    {
        path: 'dashboard',
        loadComponent: () =>
            import('./views/supervisor-dashboard/supervisor-dashboard')
                .then(m => m.SupervisorDashboard)
    },
    {
        path: 'risk-staff',
        loadComponent: () =>
            import('./views/supervisor-risk-staff/supervisor-risk-staff')
                .then(m => m.SupervisorRiskStaff)
    },
    {
        path: 'clinical-alerts',
        loadComponent: () =>
            import('./views/supervisor-clinical-alerts/supervisor-clinical-alerts')
                .then(m => m.SupervisorClinicalAlerts)
    },
    {
        path: 'anomalies',
        loadComponent: () =>
            import('./views/supervisor-anomalies/supervisor-anomalies')
                .then(m => m.SupervisorAnomalies)
    }
];

export const doctorClinicalRiskAssessmentRoutes: Routes = [
    {
        path: 'health',
        loadComponent: () =>
            import('./views/doctor-health-dashboard/doctor-health-dashboard')
                .then(m => m.DoctorHealthDashboard)
    },
    {
        path: 'vital-signs',
        loadComponent: () =>
            import('./views/doctor-vital-signs/doctor-vital-signs')
                .then(m => m.DoctorVitalSigns)
    }
];