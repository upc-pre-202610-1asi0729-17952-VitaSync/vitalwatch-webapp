import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

type ReliefStatus = 'pending' | 'accepted' | 'rejected';

interface ReliefRequest {
  id: number;
  date: string;
  reason: string;
  status: ReliefStatus;
}

@Component({
  selector: 'app-recovery',
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './recovery.html',
  styleUrl: './recovery.css'
})
export class Recovery {
  protected reliefReason = '';

  protected readonly activeRecommendation = {
    titleKey: 'medicalStaff.recovery.recommendationTitle',
    descriptionKey: 'medicalStaff.recovery.recommendationDescription'
  };

  protected readonly reliefRequests = signal<ReliefRequest[]>([
    {
      id: 1,
      date: '12/05/26',
      reason: 'Fatiga extrema durante turno prolongado',
      status: 'pending'
    },
    {
      id: 2,
      date: '09/05/26',
      reason: 'Sueño insuficiente registrado',
      status: 'accepted'
    },
    {
      id: 3,
      date: '04/05/26',
      reason: 'Malestar físico reportado',
      status: 'rejected'
    }
  ]);

  protected readonly pendingRequests = computed(() =>
    this.reliefRequests().filter(request => request.status === 'pending').length
  );

  protected sendReliefRequest(): void {
    const reason = this.reliefReason.trim();

    if (!reason) {
      return;
    }

    const newRequest: ReliefRequest = {
      id: Date.now(),
      date: new Date().toLocaleDateString('es-PE'),
      reason,
      status: 'pending'
    };

    this.reliefRequests.update(requests => [newRequest, ...requests]);
    this.reliefReason = '';
  }

  protected getStatusKey(status: ReliefStatus): string {
    return `medicalStaff.recovery.status.${status}`;
  }
}
