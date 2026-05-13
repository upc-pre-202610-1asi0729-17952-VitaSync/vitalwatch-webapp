import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

type AlertSeverity = 'veryCritical' | 'critical' | 'informative';
type AlertStatus = 'pending' | 'inFollowUp';

interface SupervisorAlert {
  id: number;
  staffName: string;
  staffRole: string;
  area: string;
  alertTypeKey: string;
  severity: AlertSeverity;
  status: AlertStatus;
  time: string;
}

@Component({
  selector: 'app-alerts',
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './alerts.html',
  styleUrl: './alerts.css'
})
export class Alerts {
  private readonly router = inject(Router);

  protected readonly searchText = signal('');
  protected readonly selectedFilter = signal<'all' | AlertSeverity>('all');

  protected readonly alerts = signal<SupervisorAlert[]>([
    {
      id: 1,
      staffName: 'Persona A',
      staffRole: 'Médico residente',
      area: 'UCI',
      alertTypeKey: 'supervisor.alerts.types.highFatigue',
      severity: 'veryCritical',
      status: 'pending',
      time: '9:42 AM'
    },
    {
      id: 2,
      staffName: 'Persona B',
      staffRole: 'Médico UCI',
      area: 'UCI',
      alertTypeKey: 'supervisor.alerts.types.highFatigue',
      severity: 'veryCritical',
      status: 'pending',
      time: '8:10 AM'
    },
    {
      id: 3,
      staffName: 'Persona C',
      staffRole: 'Médico laboratorio',
      area: 'Emergencias',
      alertTypeKey: 'supervisor.alerts.types.anomaly',
      severity: 'critical',
      status: 'inFollowUp',
      time: '7:50 AM'
    },
    {
      id: 4,
      staffName: 'Persona D',
      staffRole: 'Médico pediatría',
      area: 'Pediatría',
      alertTypeKey: 'supervisor.alerts.types.restRequired',
      severity: 'informative',
      status: 'pending',
      time: '6:37 AM'
    }
  ]);

  protected readonly filteredAlerts = computed(() => {
    const term = this.searchText().toLowerCase().trim();
    const filter = this.selectedFilter();

    return this.alerts().filter(alert => {
      const matchesSearch =
        !term ||
        alert.staffName.toLowerCase().includes(term) ||
        alert.area.toLowerCase().includes(term) ||
        alert.staffRole.toLowerCase().includes(term);

      const matchesFilter = filter === 'all' || alert.severity === filter;

      return matchesSearch && matchesFilter;
    });
  });

  protected readonly totalAlerts = computed(() => this.alerts().length);

  protected readonly veryCriticalTotal = computed(() =>
    this.alerts().filter(alert => alert.severity === 'veryCritical').length
  );

  protected readonly criticalTotal = computed(() =>
    this.alerts().filter(alert => alert.severity === 'critical').length
  );

  protected readonly informativeTotal = computed(() =>
    this.alerts().filter(alert => alert.severity === 'informative').length
  );

  protected selectFilter(filter: 'all' | AlertSeverity): void {
    this.selectedFilter.set(filter);
  }

  protected getSeverityKey(severity: AlertSeverity): string {
    return `supervisor.alerts.severity.${severity}`;
  }

  protected getStatusKey(status: AlertStatus): string {
    return `supervisor.alerts.status.${status}`;
  }

  protected registerAction(alertId: number): void {
    this.router.navigate(['/supervisor/alerts', alertId, 'action']).then();
  }
}
