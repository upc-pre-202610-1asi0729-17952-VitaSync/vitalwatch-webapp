import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

type RiskLevel = 'high' | 'medium' | 'low';

interface FatigueHistoryRecord {
  id: number;
  date: string;         // formato ISO para filtrar
  displayDate: string;  // formato visible
  fatigueScore: number;
  riskLevel: RiskLevel;
}

@Component({
  selector: 'app-my-history',
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './my-history.html',
  styleUrl: './my-history.css'
})
export class MyHistory {
  protected readonly startDate = signal('');
  protected readonly endDate = signal('');

  protected readonly historyRecords = signal<FatigueHistoryRecord[]>([
    {
      id: 1,
      date: '2026-05-12',
      displayDate: '12/05/26',
      fatigueScore: 79,
      riskLevel: 'high'
    },
    {
      id: 2,
      date: '2026-05-24',
      displayDate: '24/05/26',
      fatigueScore: 84,
      riskLevel: 'high'
    },
    {
      id: 3,
      date: '2026-06-12',
      displayDate: '12/06/26',
      fatigueScore: 34,
      riskLevel: 'low'
    },
    {
      id: 4,
      date: '2026-11-30',
      displayDate: '30/11/26',
      fatigueScore: 44,
      riskLevel: 'medium'
    }
  ]);

  protected readonly filteredRecords = computed(() => {
    const start = this.startDate();
    const end = this.endDate();

    return this.historyRecords().filter(record => {
      const afterStart = !start || record.date >= start;
      const beforeEnd = !end || record.date <= end;
      return afterStart && beforeEnd;
    });
  });

  protected readonly currentRisk = computed<RiskLevel>(() => {
    const records = this.filteredRecords();

    if (!records.length) {
      return 'low';
    }

    const latest = [...records].sort((a, b) => b.date.localeCompare(a.date))[0];
    return latest.riskLevel;
  });

  protected readonly currentRecommendationKey = computed(() => {
    const risk = this.currentRisk();

    if (risk === 'high') {
      return 'medicalStaff.history.highRiskRecommendation';
    }

    if (risk === 'medium') {
      return 'medicalStaff.history.mediumRiskRecommendation';
    }

    return 'medicalStaff.history.lowRiskRecommendation';
  });

  protected readonly currentRecommendationTitleKey = computed(() => {
    const risk = this.currentRisk();

    if (risk === 'high') {
      return 'medicalStaff.history.highRiskRecommendationTitle';
    }

    if (risk === 'medium') {
      return 'medicalStaff.history.mediumRiskRecommendationTitle';
    }

    return 'medicalStaff.history.lowRiskRecommendationTitle';
  });

  protected readonly averageScore = computed(() => {
    const records = this.filteredRecords();

    if (!records.length) {
      return 0;
    }

    const total = records.reduce((sum, record) => sum + record.fatigueScore, 0);
    return Math.round(total / records.length);
  });

  protected readonly totalEvaluations = computed(() => this.filteredRecords().length);

  protected getRiskTranslationKey(risk: RiskLevel): string {
    if (risk === 'high') return 'medicalStaff.history.high';
    if (risk === 'medium') return 'medicalStaff.history.medium';
    return 'medicalStaff.history.low';
  }

  protected applyFilter(): void {
    // No hace falta lógica extra porque usamos computed signals.
    // Este método se deja para el botón "Aplicar".
  }
}
