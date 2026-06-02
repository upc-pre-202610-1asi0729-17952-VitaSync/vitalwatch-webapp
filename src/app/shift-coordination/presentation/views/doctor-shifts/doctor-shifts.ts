import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { NgIcon } from '@ng-icons/core';
import { AuthenticationStore } from '../../../../iam/application/authentication.store';
import { IamCatalogApi } from '../../../../iam/infrastructure/apis/iam-catalog-api';
import { WorkArea } from '../../../../iam/domain/model/work-area.entity';
import { ShiftRecordApi } from '../../../infrastructure/shift-record-api';
import { ShiftRecord, ShiftStatus, ShiftType } from '../../../domain/model/shift-record.entity';

@Component({
  selector: 'app-doctor-shifts',
  imports: [
    TranslatePipe,
    DatePipe,
    NgIcon
  ],
  templateUrl: './doctor-shifts.html',
  styleUrl: './doctor-shifts.css'
})
export class DoctorShifts implements OnInit {
  private authenticationStore = inject(AuthenticationStore);
  private shiftRecordApi = inject(ShiftRecordApi);
  private catalogApi = inject(IamCatalogApi);

  protected shifts = signal<ShiftRecord[]>([]);
  protected workAreas = signal<WorkArea[]>([]);
  protected loading = signal(false);
  protected errorMessage = signal<string | null>(null);

  protected doctor = computed(() => this.authenticationStore.currentUser());

  protected currentShift = computed(() =>
    this.shifts().find(shift => shift.status === 'IN_PROGRESS') ?? null
  );

  protected nextShift = computed(() =>
    this.shifts()
      .filter(shift => shift.status === 'SCHEDULED')
      .sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime())[0] ?? null
  );

  protected upcomingShifts = computed(() =>
    this.shifts()
      .filter(shift => shift.status === 'SCHEDULED')
      .sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime())
  );

  protected completedShifts = computed(() =>
    this.shifts().filter(shift => shift.status === 'COMPLETED')
  );

  protected totalCompletedHours = computed(() =>
    this.completedShifts().reduce((total, shift) => {
      const start = new Date(shift.checkInAt ?? shift.scheduledStart).getTime();
      const end = new Date(shift.checkOutAt ?? shift.scheduledEnd).getTime();

      return total + Math.max(end - start, 0) / 1000 / 60 / 60;
    }, 0)
  );

  ngOnInit(): void {
    this.loadShifts();
  }

  protected checkIn(shift: ShiftRecord): void {
    if (!shift.isScheduled || this.currentShift()) return;

    this.shiftRecordApi.updateShiftRecordStatus(shift.id, {
      status: 'IN_PROGRESS',
      checkInAt: new Date().toISOString()
    }).subscribe({
      next: updatedShift => {
        this.replaceShift(updatedShift);
      },
      error: () => {
        this.errorMessage.set('shift.doctor.error.check-in-failed');
      }
    });
  }

  protected checkOut(shift: ShiftRecord): void {
    if (!shift.isInProgress) return;

    this.shiftRecordApi.updateShiftRecordStatus(shift.id, {
      status: 'COMPLETED',
      checkOutAt: new Date().toISOString()
    }).subscribe({
      next: updatedShift => {
        this.replaceShift(updatedShift);
      },
      error: () => {
        this.errorMessage.set('shift.doctor.error.check-out-failed');
      }
    });
  }

  protected getWorkAreaName(workAreaId: number): string {
    return this.workAreas().find(workArea => workArea.id === workAreaId)?.name ?? '—';
  }

  protected getShiftTypeLabel(type: ShiftType): string {
    const labels: Record<ShiftType, string> = {
      DAY: 'shift.doctor.type.day',
      NIGHT: 'shift.doctor.type.night'
    };

    return labels[type];
  }

  protected getShiftStatusLabel(status: ShiftStatus): string {
    const labels: Record<ShiftStatus, string> = {
      SCHEDULED: 'shift.doctor.status.scheduled',
      IN_PROGRESS: 'shift.doctor.status.in-progress',
      COMPLETED: 'shift.doctor.status.completed',
      CANCELLED: 'shift.doctor.status.cancelled'
    };

    return labels[status];
  }

  protected getShiftStatusClass(status: ShiftStatus): string {
    return status.toLowerCase().replace('_', '-');
  }

  protected getShiftDuration(shift: ShiftRecord): number {
    const start = new Date(shift.scheduledStart).getTime();
    const end = new Date(shift.scheduledEnd).getTime();

    return Math.round((end - start) / 1000 / 60 / 60);
  }

  protected formatTotalHours(value: number): string {
    return `${Math.round(value)}h`;
  }

  private loadShifts(): void {
    const doctor = this.authenticationStore.currentUser();

    if (!doctor) {
      this.errorMessage.set('shift.doctor.error.no-session');
      return;
    }

    this.loading.set(true);

    this.shiftRecordApi.getShiftRecordsByUserId(doctor.organizationId, doctor.id).subscribe({
      next: shifts => {
        this.shifts.set(shifts);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('shift.doctor.error.load-failed');
        this.loading.set(false);
      }
    });

    this.catalogApi.getWorkAreasByOrganizationId(doctor.organizationId).subscribe(workAreas => {
      this.workAreas.set(workAreas);
    });
  }

  private replaceShift(updatedShift: ShiftRecord): void {
    this.shifts.update(shifts =>
      shifts.map(shift => shift.id === updatedShift.id ? updatedShift : shift)
    );

    this.errorMessage.set(null);
  }
}