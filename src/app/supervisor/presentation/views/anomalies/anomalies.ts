import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

type AnomalyType = 'cardiac' | 'temperature' | 'all';

interface AnomalyRecord {
  id: number;
  staffName: string;
  staffRole: string;
  anomalyKey: string;
  type: AnomalyType;
  date: string;
  timestamp: string;
  descriptionKey: string;
}

@Component({
  selector: 'app-anomalies',
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './anomalies.html',
  styleUrl: './anomalies.css'
})
export class Anomalies {
  protected readonly selectedType = signal<AnomalyType>('cardiac');

  protected readonly anomalies = signal<AnomalyRecord[]>([
    {
      id: 1,
      staffName: 'Persona A.',
      staffRole: 'Médico UCI',
      anomalyKey: 'supervisor.anomalies.types.mildArrhythmia',
      type: 'cardiac',
      date: '12/05/2026',
      timestamp: '12/05/2026 16:03:21',
      descriptionKey: 'supervisor.anomalies.descriptions.cardiacVariation'
    },
    {
      id: 2,
      staffName: 'Persona J.',
      staffRole: 'Médico UCI',
      anomalyKey: 'supervisor.anomalies.types.constantArrhythmia',
      type: 'cardiac',
      date: '11/05/2026',
      timestamp: '11/05/2026 18:20:10',
      descriptionKey: 'supervisor.anomalies.descriptions.cardiacVariation'
    },
    {
      id: 3,
      staffName: 'Persona G.',
      staffRole: 'Médico pediatra',
      anomalyKey: 'supervisor.anomalies.types.mildArrhythmia',
      type: 'cardiac',
      date: '29/04/2026',
      timestamp: '29/04/2026 10:12:44',
      descriptionKey: 'supervisor.anomalies.descriptions.cardiacVariation'
    },
    {
      id: 4,
      staffName: 'Persona A.',
      staffRole: 'Médico UCI',
      anomalyKey: 'supervisor.anomalies.types.lowFever',
      type: 'temperature',
      date: '11/04/2026',
      timestamp: '11/04/2026 12:33:42',
      descriptionKey: 'supervisor.anomalies.descriptions.temperatureVariation'
    }
  ]);

  protected readonly selectedAnomaly = signal<AnomalyRecord>(this.anomalies()[0]);

  protected readonly filteredAnomalies = computed(() => {
    const type = this.selectedType();

    if (type === 'all') {
      return this.anomalies();
    }

    return this.anomalies().filter(anomaly => anomaly.type === type);
  });

  protected readonly selectedStaffAnomalies = computed(() =>
    this.anomalies().filter(
      anomaly => anomaly.staffName === this.selectedAnomaly().staffName
    )
  );

  protected changeType(type: AnomalyType): void {
    this.selectedType.set(type);

    const firstMatch = this.filteredAnomalies()[0];

    if (firstMatch) {
      this.selectedAnomaly.set(firstMatch);
    }
  }

  protected selectAnomaly(anomaly: AnomalyRecord): void {
    this.selectedAnomaly.set(anomaly);
  }

  protected getTypeLabelKey(type: AnomalyType): string {
    if (type === 'cardiac') return 'supervisor.anomalies.filters.cardiac';
    if (type === 'temperature') return 'supervisor.anomalies.filters.temperature';
    return 'supervisor.anomalies.filters.all';
  }
}
