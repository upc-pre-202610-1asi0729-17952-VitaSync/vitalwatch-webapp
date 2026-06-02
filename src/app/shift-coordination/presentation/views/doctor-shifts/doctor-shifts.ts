import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { NgIcon } from '@ng-icons/core';
import { IamStore } from '../../../../iam/application/iam.store';
import { ShiftRecord, ShiftStatus, ShiftType } from '../../../domain/model/shift-record.entity';
import { ShiftCoordinationStore } from '../../../application/shift-coordination.store';
import { AuthenticationStore } from '../../../../iam/application/authentication.store';

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
  private shiftCoordinationStore = inject(ShiftCoordinationStore);
  private iamStore = inject(IamStore);
  private authenticationStore = inject(AuthenticationStore);

  private localErrorMessage = signal<string | null>(null);

  protected shifts = computed(() =>
    this.shiftCoordinationStore.shifts()
  );

  protected doctor = computed(() =>
    this.authenticationStore.currentUser()
  );

  protected workAreas = computed(() =>
    this.iamStore.workAreas()
  );

  protected loading = computed(() =>
    this.shiftCoordinationStore.loading() || this.iamStore.loading()
  );

  protected errorMessage = computed(() =>
    this.localErrorMessage() ?? this.shiftCoordinationStore.error() ?? this.iamStore.error()
  );

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
    this.shiftCoordinationStore.loadDoctorShifts();
  }

  protected checkIn(shift: ShiftRecord): void {
    if (!shift.isScheduled || this.currentShift()) return;

    this.localErrorMessage.set(null);
    this.shiftCoordinationStore.clearError();

    this.shiftCoordinationStore.checkIn(shift).subscribe({
      next: () => {
        this.localErrorMessage.set(null);
      },
      error: () => {
        this.localErrorMessage.set('shift.doctor.error.check-in-failed');
      }
    });
  }

  protected checkOut(shift: ShiftRecord): void {
    if (!shift.isInProgress) return;

    this.localErrorMessage.set(null);
    this.shiftCoordinationStore.clearError();

    this.shiftCoordinationStore.checkOut(shift).subscribe({
      next: () => {
        this.localErrorMessage.set(null);
      },
      error: () => {
        this.localErrorMessage.set('shift.doctor.error.check-out-failed');
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
}