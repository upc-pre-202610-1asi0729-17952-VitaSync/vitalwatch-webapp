import { Component, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { MatSelectModule } from '@angular/material/select';
import { NgIcon } from '@ng-icons/core';

import {
    ShiftCoordinationStore,
    SupervisorShiftStatusFilter
} from '../../../application/shift-coordination.store';
import { ShiftRecord, ShiftStatus, ShiftType } from '../../../domain/model/shift-record.entity';

@Component({
    selector: 'app-supervisor-shifts',
    imports: [
        ReactiveFormsModule,
        TranslatePipe,
        DatePipe,
        MatSelectModule,
        NgIcon
    ],
    templateUrl: './supervisor-shifts.html',
    styleUrl: './supervisor-shifts.css'
})
export class SupervisorShifts implements OnInit {
    private formBuilder = inject(NonNullableFormBuilder);
    private shiftCoordinationStore = inject(ShiftCoordinationStore);

    protected loading = this.shiftCoordinationStore.loading;
    protected errorMessage = this.shiftCoordinationStore.error;

    protected assignedDoctors = this.shiftCoordinationStore.assignedSupervisorDoctors;
    protected filteredShifts = this.shiftCoordinationStore.filteredSupervisorShifts;
    protected statusFilter = this.shiftCoordinationStore.supervisorShiftStatusFilter;

    protected scheduledShifts = this.shiftCoordinationStore.scheduledSupervisorShifts;
    protected inProgressShifts = this.shiftCoordinationStore.inProgressSupervisorShifts;
    protected completedShifts = this.shiftCoordinationStore.completedSupervisorShifts;
    protected cancelledShifts = this.shiftCoordinationStore.cancelledSupervisorShifts;

    protected shiftTypes: ShiftType[] = ['DAY', 'NIGHT'];

    protected form = this.formBuilder.group({
        userId: [0, [Validators.required]],
        type: ['DAY' as ShiftType, [Validators.required]],
        scheduledDate: [this.getTodayInputValue(), [Validators.required]],
        startTime: ['07:00', [Validators.required]],
        endTime: ['19:00', [Validators.required]]
    });

    ngOnInit(): void {
        this.shiftCoordinationStore.loadSupervisorShifts();
    }

    protected createShift(): void {
        if (this.form.invalid || this.form.controls.userId.value === 0) {
            this.form.markAllAsTouched();
            return;
        }

        const doctor = this.shiftCoordinationStore.getUserById(this.form.controls.userId.value);

        if (!doctor?.workAreaId) {
            this.shiftCoordinationStore.setError('shift.supervisor.error.doctor-without-area');
            return;
        }

        const scheduledStart = this.buildDateTime(
            this.form.controls.scheduledDate.value,
            this.form.controls.startTime.value
        );

        let scheduledEnd = this.buildDateTime(
            this.form.controls.scheduledDate.value,
            this.form.controls.endTime.value
        );

        if (new Date(scheduledEnd).getTime() <= new Date(scheduledStart).getTime()) {
            const endDate = new Date(scheduledEnd);
            endDate.setDate(endDate.getDate() + 1);
            scheduledEnd = endDate.toISOString();
        }

        this.shiftCoordinationStore.createShiftRecord({
            organizationId: doctor.organizationId,
            userId: doctor.id,
            workAreaId: doctor.workAreaId,
            type: this.form.controls.type.value,
            scheduledStart,
            scheduledEnd
        }).subscribe({
            next: () => {
                this.form.reset({
                    userId: 0,
                    type: 'DAY',
                    scheduledDate: this.getTodayInputValue(),
                    startTime: '07:00',
                    endTime: '19:00'
                });
            }
        });
    }

    protected cancelShift(shift: ShiftRecord): void {
        if (!shift.isScheduled) return;

        this.shiftCoordinationStore.cancelSupervisorShift(shift).subscribe();
    }

    protected updateSearchTerm(event: Event): void {
        const input = event.target as HTMLInputElement;

        this.shiftCoordinationStore.updateSupervisorShiftSearchTerm(input.value);
    }

    protected updateStatusFilter(value: SupervisorShiftStatusFilter): void {
        this.shiftCoordinationStore.updateSupervisorShiftStatusFilter(value);
    }

    protected getDoctorName(userId: number): string {
        return this.shiftCoordinationStore.getUserById(userId)?.fullName ?? '—';
    }

    protected getDoctorEmail(userId: number): string {
        return this.shiftCoordinationStore.getUserById(userId)?.email ?? '—';
    }

    protected getWorkAreaName(workAreaId?: number): string {
        return this.shiftCoordinationStore.getWorkAreaName(workAreaId);
    }

    protected getTeamName(userId: number): string {
        return this.shiftCoordinationStore.getTeamNameByUserId(userId);
    }

    protected getShiftTypeLabel(type: ShiftType): string {
        return this.shiftCoordinationStore.getShiftTypeLabel(type);
    }

    protected getShiftStatusLabel(status: ShiftStatus): string {
        return this.shiftCoordinationStore.getShiftStatusLabel(status);
    }

    protected getShiftStatusClass(status: ShiftStatus): string {
        return this.shiftCoordinationStore.getShiftStatusClass(status);
    }

    protected getShiftHours(shift: ShiftRecord): string {
        const start = new Date(shift.scheduledStart).getTime();
        const end = new Date(shift.scheduledEnd).getTime();
        const hours = Math.max(end - start, 0) / 1000 / 60 / 60;

        return `${Math.round(hours)}h`;
    }

    private buildDateTime(date: string, time: string): string {
        return new Date(`${date}T${time}:00`).toISOString();
    }

    private getTodayInputValue(): string {
        return new Date().toISOString().slice(0, 10);
    }
}