import { Routes } from '@angular/router';

import { moduleAccessGuard } from '../../subscription-plan-management/application/module-access.guard';

export const adminAuditComplianceRoutes: Routes = [
    {
        path: 'reports',
        canActivate: [moduleAccessGuard],
        data: {
            module: 'ADMIN_REPORTS'
        },
        loadComponent: () =>
            import('./views/admin-reports/admin-reports')
                .then(m => m.AdminReports)
    },
    {
        path: 'audit',
        canActivate: [moduleAccessGuard],
        data: {
            module: 'ADMIN_AUDIT'
        },
        loadComponent: () =>
            import('./views/admin-audit/admin-audit')
                .then(m => m.AdminAudit)
    }
];