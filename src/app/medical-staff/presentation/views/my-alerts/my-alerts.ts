import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

type AlertStatus = 'unread' | 'read';
type AlertSeverity = 'veryCritical' | 'critical' | 'informative';

interface MedicalAlert {
  id: number;
  titleKey: string;
  descriptionKey: string;
  severity: AlertSeverity;
  severityKey: string;
  status: AlertStatus;
  time: string;
  dotClass: string;
}

@Component({
  selector: 'app-my-alerts',
  imports: [CommonModule, TranslatePipe],
  templateUrl: './my-alerts.html',
  styleUrl: './my-alerts.css'
})
export class MyAlerts {
  protected readonly selectedFilter = signal<'all' | 'unread' | 'read'>('all');

  protected readonly alerts = signal<MedicalAlert[]>([
    {
      id: 1,
      titleKey: 'medicalStaff.alerts.extremeFatigueTitle',
      descriptionKey: 'medicalStaff.alerts.extremeFatigueDescription',
      severity: 'veryCritical',
      severityKey: 'medicalStaff.alerts.veryCritical',
      status: 'unread',
      time: 'Hoy - 9:42 AM',
      dotClass: 'red'
    },
    {
      id: 2,
      titleKey: 'medicalStaff.alerts.insufficientSleepTitle',
      descriptionKey: 'medicalStaff.alerts.insufficientSleepDescription',
      severity: 'critical',
      severityKey: 'medicalStaff.alerts.critical',
      status: 'unread',
      time: 'Hoy - 6:00 AM',
      dotClass: 'orange'
    },
    {
      id: 3,
      titleKey: 'medicalStaff.alerts.highHeartRateTitle',
      descriptionKey: 'medicalStaff.alerts.highHeartRateDescription',
      severity: 'informative',
      severityKey: 'medicalStaff.alerts.informative',
      status: 'read',
      time: 'Ayer - 22:10 PM',
      dotClass: 'blue'
    }
  ]);

  protected readonly totalAlerts = computed(() => this.alerts().length);

  protected readonly unreadAlerts = computed(() =>
    this.alerts().filter(alert => alert.status === 'unread').length
  );

  protected readonly readAlerts = computed(() =>
    this.alerts().filter(alert => alert.status === 'read').length
  );

  protected readonly filteredAlerts = computed(() => {
    const filter = this.selectedFilter();

    if (filter === 'unread') {
      return this.alerts().filter(alert => alert.status === 'unread');
    }

    if (filter === 'read') {
      return this.alerts().filter(alert => alert.status === 'read');
    }

    return this.alerts();
  });

  protected selectFilter(filter: 'all' | 'unread' | 'read'): void {
    this.selectedFilter.set(filter);
  }

  protected markAllAsRead(): void {
    this.alerts.update(alerts =>
      alerts.map(alert => ({
        ...alert,
        status: 'read'
      }))
    );
  }

  protected requestRelief(alert: MedicalAlert): void {
    console.log('Relief requested for alert:', alert.id);
  }
}
