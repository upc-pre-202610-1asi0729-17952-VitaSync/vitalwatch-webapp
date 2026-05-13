import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

interface ActionAlert {
  id: number;
  staffName: string;
  staffRole: string;
  alertTypeKey: string;
  recommendationKey: string;
  suggestedReplacementKey: string;
}

@Component({
  selector: 'app-register-action',
  imports: [FormsModule, TranslatePipe],
  templateUrl: './register-action.html',
  styleUrl: './register-action.css'
})
export class RegisterAction {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected intervention = signal(
    'Se le releva por Persona B (Médico UCI) debido a un nivel de fatiga muy alta e incapacidad de trabajar de forma segura'
  );

  private readonly alerts: ActionAlert[] = [
    {
      id: 1,
      staffName: 'Persona A.',
      staffRole: 'Médico residente',
      alertTypeKey: 'supervisor.alerts.types.highFatigue',
      recommendationKey: 'supervisor.action.recommendationText',
      suggestedReplacementKey: 'supervisor.action.suggestedReplacement'
    },
    {
      id: 2,
      staffName: 'Persona B.',
      staffRole: 'Médico UCI',
      alertTypeKey: 'supervisor.alerts.types.highFatigue',
      recommendationKey: 'supervisor.action.recommendationText',
      suggestedReplacementKey: 'supervisor.action.suggestedReplacement'
    },
    {
      id: 3,
      staffName: 'Persona C.',
      staffRole: 'Médico laboratorio',
      alertTypeKey: 'supervisor.alerts.types.anomaly',
      recommendationKey: 'supervisor.action.anomalyRecommendation',
      suggestedReplacementKey: 'supervisor.action.monitoringSuggested'
    },
    {
      id: 4,
      staffName: 'Persona D.',
      staffRole: 'Médico pediatría',
      alertTypeKey: 'supervisor.alerts.types.restRequired',
      recommendationKey: 'supervisor.action.restRecommendation',
      suggestedReplacementKey: 'supervisor.action.restSuggested'
    }
  ];

  protected readonly selectedAlert = computed(() => {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    return this.alerts.find(alert => alert.id === id) ?? this.alerts[0];
  });

  protected confirmAction(): void {
    console.log('Intervention registered:', this.intervention());
    this.router.navigate(['/supervisor/alerts']).then();
  }
}
