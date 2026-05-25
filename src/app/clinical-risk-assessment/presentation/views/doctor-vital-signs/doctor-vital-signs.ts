import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthenticationStore } from '../../../../iam/application/authentication.store';
import { VitalSignReadingApi } from '../../../infrastructure/vital-sign-reading-api';
import { VitalSignReading } from '../../../domain/model/vital-sign-reading.entity';
import { RiskLevel } from '../../../domain/model/risk-assessment.entity';

@Component({
  selector: 'app-doctor-vital-signs',
  imports: [
    TranslatePipe,
    DatePipe,
  ],
  templateUrl: './doctor-vital-signs.html',
  styleUrl: './doctor-vital-signs.css'
})
export class DoctorVitalSigns implements OnInit {
  private authenticationStore = inject(AuthenticationStore);
  private vitalSignReadingApi = inject(VitalSignReadingApi);

  protected readings = signal<VitalSignReading[]>([]);
  protected loading = signal(false);
  protected errorMessage = signal<string | null>(null);

  protected readonly chartWidth = 680;
  protected readonly chartHeight = 240;
  protected readonly chartPadding = 36;

  protected doctor = computed(() => this.authenticationStore.currentUser());

  protected chartReadings = computed(() =>
    [...this.readings()].slice(0, 7).reverse()
  );

  protected tableReadings = computed(() =>
    [...this.readings()].slice(0, 7)
  );

  protected cortisolPolyline = computed(() =>
    this.getLinePoints(this.chartReadings().map(reading => reading.cortisolLevel), 350, 650)
  );

  protected hrvPolyline = computed(() =>
    this.getLinePoints(this.chartReadings().map(reading => reading.hrv), 15, 45)
  );

  protected cortisolPoints = computed(() =>
    this.getChartPoints(this.chartReadings().map(reading => reading.cortisolLevel), 350, 650)
  );

  protected hrvPoints = computed(() =>
    this.getChartPoints(this.chartReadings().map(reading => reading.hrv), 15, 45)
  );

  protected heartRateBars = computed(() => {
    const readings = this.chartReadings();
    const barWidth = 58;

    return readings.map((reading, index) => {
      const x = this.getChartX(index, readings.length) - barWidth / 2;
      const y = this.getChartY(reading.heartRate, 40, 110);
      const height = this.chartHeight - this.chartPadding - y;

      return {
        id: reading.id,
        x,
        y,
        width: barWidth,
        height,
        value: reading.heartRate,
        isHigh: reading.heartRate >= 90
      };
    });
  });

  protected chartLabels = computed(() => {
    const readings = this.chartReadings();

    return readings.map((reading, index) => ({
      id: reading.id,
      x: this.getChartX(index, readings.length),
      label: this.formatChartDay(reading.recordedAt)
    }));
  });

  ngOnInit(): void {
    this.loadVitalSigns();
  }

  protected getFatigueRiskLevel(fatigueLevel: number): RiskLevel {
    if (fatigueLevel >= 75) return 'HIGH';
    if (fatigueLevel >= 50) return 'MODERATE';
    return 'LOW';
  }

  protected getRiskLabel(riskLevel: RiskLevel): string {
    const labels: Record<RiskLevel, string> = {
      LOW: 'clinical.risk.low',
      MODERATE: 'clinical.risk.moderate',
      HIGH: 'clinical.risk.high',
      CRITICAL: 'clinical.risk.critical'
    };

    return labels[riskLevel];
  }

  protected getRiskClass(riskLevel: RiskLevel): string {
    return riskLevel.toLowerCase();
  }

  protected getShiftLabel(value: string): string {
    const hour = new Date(value).getHours();

    if (hour < 12) return 'clinical.vitalSigns.shift.morning';
    if (hour < 18) return 'clinical.vitalSigns.shift.afternoon';
    return 'clinical.vitalSigns.shift.night';
  }

  private loadVitalSigns(): void {
    const doctor = this.authenticationStore.currentUser();

    if (!doctor) {
      this.errorMessage.set('clinical.vitalSigns.error.no-session');
      return;
    }

    this.loading.set(true);

    this.vitalSignReadingApi.getReadingsByUserId(doctor.organizationId, doctor.id).subscribe({
      next: readings => {
        this.readings.set(readings);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('clinical.vitalSigns.error.load-failed');
        this.loading.set(false);
      }
    });
  }

  private getLinePoints(values: number[], min: number, max: number): string {
    return this.getChartPoints(values, min, max)
      .map(point => `${point.x},${point.y}`)
      .join(' ');
  }

  private getChartPoints(values: number[], min: number, max: number): { x: number; y: number; value: number }[] {
    return values.map((value, index) => ({
      x: this.getChartX(index, values.length),
      y: this.getChartY(value, min, max),
      value
    }));
  }

  private getChartX(index: number, length: number): number {
    if (length <= 1) return this.chartPadding;

    const drawableWidth = this.chartWidth - this.chartPadding * 2;

    return this.chartPadding + (drawableWidth / (length - 1)) * index;
  }

  private getChartY(value: number, min: number, max: number): number {
    const drawableHeight = this.chartHeight - this.chartPadding * 2;
    const normalizedValue = Math.min(Math.max((value - min) / (max - min), 0), 1);

    return this.chartPadding + drawableHeight - normalizedValue * drawableHeight;
  }

  private formatChartDay(value: string): string {
    const date = new Date(value);
    const weekday = date.toLocaleDateString('es-PE', { weekday: 'short' }).replace('.', '');

    return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${date.getDate()}`;
  }
}