import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexFill,
  ApexGrid,
  ApexMarkers,
  ApexPlotOptions,
  ApexStroke,
  ApexTooltip,
  ApexXAxis,
  ApexYAxis,
  NgApexchartsModule,
} from 'ng-apexcharts';

import { AuthenticationStore } from '../../../../iam/application/authentication.store';
import { ClinicalRiskStore } from '../../../application/clinical-risk.store';
import { RiskLevel } from '../../../domain/model/risk-assessment.entity';
import { VitalSignReading } from '../../../domain/model/vital-sign-reading.entity';

type LineChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  stroke: ApexStroke;
  markers: ApexMarkers;
  dataLabels: ApexDataLabels;
  grid: ApexGrid;
  tooltip: ApexTooltip;
  colors: string[];
};

type BarChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  plotOptions: ApexPlotOptions;
  dataLabels: ApexDataLabels;
  grid: ApexGrid;
  tooltip: ApexTooltip;
  fill: ApexFill;
  colors: string[];
};

@Component({
  selector: 'app-doctor-vital-signs',
  standalone: true,
  imports: [TranslatePipe, DatePipe, NgApexchartsModule],
  templateUrl: './doctor-vital-signs.html',
  styleUrl: './doctor-vital-signs.css',
})
export class DoctorVitalSigns implements OnInit, OnDestroy {
  private authenticationStore = inject(AuthenticationStore);
  private clinicalRiskStore = inject(ClinicalRiskStore);

  private localErrorMessage = signal<string | null>(null);
  private refreshTimerId: ReturnType<typeof setInterval> | null = null;

  protected readonly refreshIntervalSeconds = 10;
  protected readonly chartWindowSize = 20;
  protected readonly tableWindowSize = 10;

  protected doctor = computed(() => this.authenticationStore.currentUser());

  protected readings = computed(() => this.clinicalRiskStore.vitalSignReadings());

  protected loading = computed(() => this.clinicalRiskStore.loading());

  protected errorMessage = computed(
    () => this.localErrorMessage() ?? this.clinicalRiskStore.error(),
  );

  protected chartReadings = computed(() => this.getRecentReadings(this.chartWindowSize));

  protected tableReadings = computed(() => this.getRecentReadings(this.tableWindowSize).reverse());

  protected cortisolChartOptions = computed<LineChartOptions>(() => {
    const readings = this.chartReadings();
    const cortisolValues = readings.map((reading) => reading.cortisolLevel);

    return {
      series: [
        {
          name: 'Cortisol',
          data: cortisolValues,
        },
      ],
      chart: {
        type: 'line',
        height: 300,
        toolbar: { show: false },
        zoom: { enabled: false },
        fontFamily: 'inherit',
      },
      colors: ['#7c3aed'],
      stroke: {
        curve: 'smooth',
        width: 4,
        lineCap: 'round',
      },
      markers: {
        size: 5,
        strokeWidth: 3,
        strokeColors: '#ffffff',
        colors: ['#7c3aed'],
        hover: { size: 7 },
      },
      dataLabels: { enabled: false },
      grid: this.buildGrid(),
      xaxis: this.buildCleanXAxis(readings),
      yaxis: this.buildDynamicYAxis(cortisolValues, 350, 650, 3, 10),
      tooltip: this.buildTooltip(readings, (value) => `${Math.round(value)} nmol/L`),
    };
  });

  protected hrvChartOptions = computed<LineChartOptions>(() => {
    const readings = this.chartReadings();
    const hrvValues = readings.map((reading) => reading.hrv);

    return {
      series: [
        {
          name: 'HRV',
          data: hrvValues,
        },
      ],
      chart: {
        type: 'line',
        height: 300,
        toolbar: { show: false },
        zoom: { enabled: false },
        fontFamily: 'inherit',
      },
      colors: ['#11c7c7'],
      stroke: {
        curve: 'smooth',
        width: 4,
        lineCap: 'round',
      },
      markers: {
        size: 5,
        strokeWidth: 3,
        strokeColors: '#ffffff',
        colors: ['#11c7c7'],
        hover: { size: 7 },
      },
      dataLabels: { enabled: false },
      grid: this.buildGrid(),
      xaxis: this.buildCleanXAxis(readings),
      yaxis: this.buildDynamicYAxis(hrvValues, 15, 75, 4, 5),
      tooltip: this.buildTooltip(readings, (value) => `${Math.round(value)} ms`),
    };
  });

  protected heartRateChartOptions = computed<BarChartOptions>(() => {
    const readings = this.chartReadings();
    const heartRateValues = readings.map((reading) => reading.heartRate);

    return {
      series: [
        {
          name: 'BPM',
          data: readings.map((reading, index) => {
            const riskLevel = this.getHeartRateRiskLevel(reading.heartRate);

            return {
              x: `${index + 1}`,
              y: reading.heartRate,
              fillColor: this.getHeartRateColor(riskLevel),
            };
          }) as any,
        },
      ],
      chart: {
        type: 'bar',
        height: 360,
        toolbar: { show: false },
        zoom: { enabled: false },
        fontFamily: 'inherit',
      },
      colors: ['#11c7c7'],
      plotOptions: {
        bar: {
          borderRadius: 10,
          columnWidth: '42%',
          distributed: false,
        },
      },
      dataLabels: { enabled: false },
      fill: { opacity: 1 },
      grid: this.buildGrid(),
      xaxis: this.buildHeartRateXAxis(readings),
      yaxis: this.buildDynamicYAxis(heartRateValues, 40, 130, 4, 8),
      tooltip: this.buildTooltip(readings, (value) => {
        const riskLevel = this.getHeartRateRiskLevel(value);
        return `${Math.round(value)} bpm · ${riskLevel}`;
      }),
    };
  });

  ngOnInit(): void {
    this.loadVitalSigns();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
  }

  protected getFatigueRiskLevel(fatigueLevel: number): RiskLevel {
    if (fatigueLevel >= 90) return 'CRITICAL';
    if (fatigueLevel >= 75) return 'HIGH';
    if (fatigueLevel >= 50) return 'MODERATE';

    return 'LOW';
  }

  protected getRiskLabel(riskLevel: RiskLevel): string {
    const labels: Record<RiskLevel, string> = {
      LOW: 'clinical.risk.low',
      MODERATE: 'clinical.risk.moderate',
      HIGH: 'clinical.risk.high',
      CRITICAL: 'clinical.risk.critical',
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
      this.localErrorMessage.set('clinical.vitalSigns.error.no-session');
      return;
    }

    this.localErrorMessage.set(null);
    this.clinicalRiskStore.clearError();
    this.clinicalRiskStore.loadVitalSignReadingsForCurrentDoctor();
  }

  private startAutoRefresh(): void {
    this.stopAutoRefresh();

    this.refreshTimerId = setInterval(() => {
      if (document.hidden) return;

      this.loadVitalSigns();
    }, this.refreshIntervalSeconds * 1000);
  }

  private stopAutoRefresh(): void {
    if (!this.refreshTimerId) return;

    clearInterval(this.refreshTimerId);
    this.refreshTimerId = null;
  }

  private getRecentReadings(limit: number): VitalSignReading[] {
    return [...this.readings()]
      .filter((reading) => Boolean(reading.recordedAt))
      .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
      .slice(-limit);
  }

  private getHeartRateRiskLevel(heartRate: number): RiskLevel {
    if (heartRate >= 120) return 'CRITICAL';
    if (heartRate >= 110) return 'HIGH';
    if (heartRate >= 95) return 'MODERATE';

    return 'LOW';
  }

  private getHeartRateColor(riskLevel: RiskLevel): string {
    const colors: Record<RiskLevel, string> = {
      LOW: '#11c7c7',
      MODERATE: '#f59e0b',
      HIGH: '#f97316',
      CRITICAL: '#ef4444',
    };

    return colors[riskLevel];
  }

  private buildGrid(): ApexGrid {
    return {
      borderColor: '#e8eef7',
      strokeDashArray: 0,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    };
  }

  private buildCleanXAxis(readings: VitalSignReading[]): ApexXAxis {
    return {
      categories: readings.map((_, index) => `${index + 1}`),
      axisBorder: {
        show: true,
        color: '#dbe3ef',
      },
      axisTicks: { show: false },
      labels: {
        show: false,
      },
      tooltip: {
        enabled: false,
      },
    };
  }

  private buildHeartRateXAxis(readings: VitalSignReading[]): ApexXAxis {
    const visibleLabelStep = Math.max(1, Math.ceil(readings.length / 6));

    return {
      categories: readings.map((_, index) => `${index + 1}`),
      axisBorder: {
        show: true,
        color: '#dbe3ef',
      },
      axisTicks: { show: false },
      labels: {
        show: true,
        rotate: 0,
        trim: false,
        hideOverlappingLabels: true,
        style: {
          colors: '#8b9abb',
          fontSize: '12px',
          fontWeight: 800,
        },
        formatter: (value: string) => {
          const index = Number(value) - 1;

          if (!Number.isInteger(index) || !readings[index]) return '';

          const shouldShowLabel =
            index === 0 || index === readings.length - 1 || index % visibleLabelStep === 0;

          return shouldShowLabel ? this.formatAxisTime(readings[index].recordedAt) : '';
        },
      },
      tooltip: {
        enabled: false,
      },
    };
  }

  private buildTooltip(
    readings: VitalSignReading[],
    yFormatter: (value: number) => string,
  ): ApexTooltip {
    const fullTimeLabels = readings.map((reading) => this.formatTooltipTime(reading.recordedAt));

    return {
      x: {
        formatter: (_value: number, options?: any) =>
          fullTimeLabels[options?.dataPointIndex ?? 0] ?? '',
      },
      y: {
        formatter: (value: number) => yFormatter(value),
      },
    };
  }

  private buildDynamicYAxis(
    values: number[],
    fallbackMin: number,
    fallbackMax: number,
    tickAmount: number,
    minimumPadding: number,
  ): ApexYAxis {
    const numericValues = values.filter((value) => Number.isFinite(value));

    if (!numericValues.length) {
      return this.buildYAxis(fallbackMin, fallbackMax, tickAmount);
    }

    let minValue = Math.min(...numericValues);
    let maxValue = Math.max(...numericValues);

    if (minValue === maxValue) {
      minValue -= minimumPadding;
      maxValue += minimumPadding;
    }

    const padding = Math.max((maxValue - minValue) * 0.15, minimumPadding);
    const min = Math.max(0, Math.floor(minValue - padding));
    const max = Math.ceil(maxValue + padding);

    return this.buildYAxis(min, max, tickAmount);
  }

  private buildYAxis(min: number, max: number, tickAmount: number): ApexYAxis {
    return {
      min,
      max,
      tickAmount,
      labels: {
        style: {
          colors: '#8b9abb',
          fontSize: '13px',
          fontWeight: 800,
        },
        formatter: (value: number) => `${Math.round(value)}`,
      },
    };
  }

  private formatAxisTime(value: string): string {
    return new Intl.DateTimeFormat('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(value));
  }

  private formatTooltipTime(value: string): string {
    return new Intl.DateTimeFormat('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date(value));
  }
}
