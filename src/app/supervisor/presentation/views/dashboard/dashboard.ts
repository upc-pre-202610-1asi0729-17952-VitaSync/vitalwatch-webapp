import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

interface RiskStaff {
  name: string;
  area: string;
  riskTypeKey: string;
  fatigueLevelKey: string;
  statusKey: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, TranslatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {
  protected readonly riskStaff: RiskStaff[] = [
    {
      name: 'Persona A',
      area: 'UCI',
      riskTypeKey: 'supervisor.common.fatigue',
      fatigueLevelKey: 'supervisor.common.high',
      statusKey: 'supervisor.common.pending'
    },
    {
      name: 'Persona B',
      area: 'Emergencias',
      riskTypeKey: 'supervisor.common.anomaly',
      fatigueLevelKey: 'supervisor.common.regular',
      statusKey: 'supervisor.common.inFollowUp'
    },
    {
      name: 'Persona C',
      area: 'Pediatría',
      riskTypeKey: 'supervisor.common.fatigue',
      fatigueLevelKey: 'supervisor.common.high',
      statusKey: 'supervisor.common.pending'
    }
  ];

  protected readonly recentAlerts = [
    'supervisor.dashboard.recentAlertA',
    'supervisor.dashboard.recentAlertB',
    'supervisor.dashboard.recentAlertC',
    'supervisor.dashboard.recentAlertD'
  ];
}
