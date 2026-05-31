import { Component, computed, inject, OnInit, signal } from '@angular/core';
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
  NgApexchartsModule
} from 'ng-apexcharts';
import { AuthenticationStore } from '../../../../iam/application/authentication.store';
import { VitalSignReadingApi } from '../../../infrastructure/vital-sign-reading-api';
import { VitalSignReading } from '../../../domain/model/vital-sign-reading.entity';
import { RiskLevel } from '../../../domain/model/risk-assessment.entity';

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
  imports: [
    TranslatePipe,
    DatePipe,
    NgApexchartsModule
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

  protected doctor = computed(() => this.authenticationStore.currentUser());

  protected chartReadings = computed(() =>
    [...this.readings()].slice(0, 7).reverse()
  );

  protected tableReadings = computed(() =>
    [...this.readings()].slice(0, 7)
  );

  protected cortisolChartOptions = computed<LineChartOptions>(() => {
    const readings = this.chartReadings();

    return {
      series: [
        {
          name: 'Cortisol',
          data: readings.map(reading => reading.cortisolLevel)
        }
      ],
      chart: {
        type: 'line',
        height: 300,
        toolbar: {
          show: false
        },
        zoom: {
          enabled: false
        },
        fontFamily: 'inherit'
      },
      colors: ['#7c3aed'],
      stroke: {
        curve: 'smooth',
        width: 4,
        lineCap: 'round'
      },
      markers: {
        size: 5,
        strokeWidth: 3,
        strokeColors: '#ffffff',
        colors: ['#7c3aed'],
        hover: {
          size: 7
        }
      },
      dataLabels: {
        enabled: false
      },
      grid: {
        borderColor: '#e8eef7',
        strokeDashArray: 0,
        xaxis: {
          lines: {
            show: false
          }
        },
        yaxis: {
          lines: {
            show: true
          }
        }
      },
      xaxis: {
        categories: readings.map(reading => this.formatChartDay(reading.recordedAt)),
        axisBorder: {
          show: true,
          color: '#dbe3ef'
        },
        axisTicks: {
          show: false
        },
        labels: {
          style: {
            colors: '#8b9abb',
            fontSize: '13px',
            fontWeight: 800
          }
        }
      },
      yaxis: {
        min: 350,
        max: 650,
        tickAmount: 3,
        labels: {
          style: {
            colors: '#8b9abb',
            fontSize: '13px',
            fontWeight: 800
          },
          formatter: (value: number) => `${Math.round(value)}`
        }
      },
      tooltip: {
        y: {
          formatter: (value: number) => `${value} nmol/L`
        }
      }
    };
  });

  protected hrvChartOptions = computed<LineChartOptions>(() => {
    const readings = this.chartReadings();

    return {
      series: [
        {
          name: 'HRV',
          data: readings.map(reading => reading.hrv)
        }
      ],
      chart: {
        type: 'line',
        height: 300,
        toolbar: {
          show: false
        },
        zoom: {
          enabled: false
        },
        fontFamily: 'inherit'
      },
      colors: ['#11c7c7'],
      stroke: {
        curve: 'smooth',
        width: 4,
        lineCap: 'round'
      },
      markers: {
        size: 5,
        strokeWidth: 3,
        strokeColors: '#ffffff',
        colors: ['#11c7c7'],
        hover: {
          size: 7
        }
      },
      dataLabels: {
        enabled: false
      },
      grid: {
        borderColor: '#e8eef7',
        strokeDashArray: 0,
        xaxis: {
          lines: {
            show: false
          }
        },
        yaxis: {
          lines: {
            show: true
          }
        }
      },
      xaxis: {
        categories: readings.map(reading => this.formatChartDay(reading.recordedAt)),
        axisBorder: {
          show: true,
          color: '#dbe3ef'
        },
        axisTicks: {
          show: false
        },
        labels: {
          style: {
            colors: '#8b9abb',
            fontSize: '13px',
            fontWeight: 800
          }
        }
      },
      yaxis: {
        min: 15,
        max: 45,
        tickAmount: 3,
        labels: {
          style: {
            colors: '#8b9abb',
            fontSize: '13px',
            fontWeight: 800
          },
          formatter: (value: number) => `${Math.round(value)}`
        }
      },
      tooltip: {
        y: {
          formatter: (value: number) => `${value} ms`
        }
      }
    };
  });

  protected heartRateChartOptions = computed<BarChartOptions>(() => {
    const readings = this.chartReadings();

    return {
      series: [
        {
          name: 'BPM',
          data: readings.map(reading => {
            const riskLevel = this.getHeartRateRiskLevel(reading.heartRate);

            return {
              x: this.formatChartDay(reading.recordedAt),
              y: reading.heartRate,
              fillColor: this.getHeartRateColor(riskLevel)
            };
          }) as any
        }
      ],
      chart: {
        type: 'bar',
        height: 360,
        toolbar: {
          show: false
        },
        zoom: {
          enabled: false
        },
        fontFamily: 'inherit'
      },
      colors: ['#11c7c7'],
      plotOptions: {
        bar: {
          borderRadius: 10,
          columnWidth: '42%',
          distributed: false
        }
      },
      dataLabels: {
        enabled: false
      },
      fill: {
        opacity: 1
      },
      grid: {
        borderColor: '#e8eef7',
        strokeDashArray: 0,
        xaxis: {
          lines: {
            show: false
          }
        },
        yaxis: {
          lines: {
            show: true
          }
        }
      },
      xaxis: {
        axisBorder: {
          show: true,
          color: '#dbe3ef'
        },
        axisTicks: {
          show: false
        },
        labels: {
          style: {
            colors: '#8b9abb',
            fontSize: '14px',
            fontWeight: 900
          }
        }
      },
      yaxis: {
        min: 40,
        max: 120,
        tickAmount: 4,
        labels: {
          style: {
            colors: '#8b9abb',
            fontSize: '14px',
            fontWeight: 900
          },
          formatter: (value: number) => `${Math.round(value)}`
        }
      },
      tooltip: {
        y: {
          formatter: (value: number) => {
            const riskLevel = this.getHeartRateRiskLevel(value);

            return `${value} bpm · ${riskLevel}`;
          }
        }
      }
    };
  });

  private getHeartRateRiskLevel(heartRate: number): RiskLevel {
    if (heartRate >= 115) return 'CRITICAL';
    if (heartRate >= 105) return 'HIGH';
    if (heartRate >= 90) return 'MODERATE';

    return 'LOW';
  }

  private getHeartRateColor(riskLevel: RiskLevel): string {
    const colors: Record<RiskLevel, string> = {
      LOW: '#11c7c7',
      MODERATE: '#f59e0b',
      HIGH: '#f97316',
      CRITICAL: '#ef4444'
    };

    return colors[riskLevel];
  }

  ngOnInit(): void {
    this.loadVitalSigns();
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
    this.errorMessage.set(null);

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

  private formatChartDay(value: string): string {
    const date = new Date(value);
    const weekday = date
      .toLocaleDateString('es-PE', { weekday: 'short' })
      .replace('.', '');

    return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${date.getDate()}`;
  }
}