import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

interface FatigueEvaluation {
  date: string;
  fatigueScore: string;
  riskLevelKey: string;
}

interface RiskStaffMember {
  id: number;
  name: string;
  role: string;
  area: string;
  statusKey: string;
  riskLabelKey: string;
  riskBadgeKey: string;
  riskBadgeClass: string;
  riskLevelKey: string;
  shiftTime: string;
  evaluations: FatigueEvaluation[];
}

@Component({
  selector: 'app-risk-staff',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './risk-staff.html',
  styleUrl: './risk-staff.css'
})
export class RiskStaffComponent {
  searchText = '';

  staffMembers: RiskStaffMember[] = [
    {
      id: 1,
      name: 'Persona A.',
      role: 'Médico UCI',
      area: 'UCI',
      statusKey: 'supervisor.common.active',
      riskLabelKey: 'supervisor.riskStaff.highRisk',
      riskBadgeKey: 'supervisor.riskStaff.highRisk',
      riskBadgeClass: 'high',
      riskLevelKey: 'supervisor.common.high',
      shiftTime: '11 horas',
      evaluations: [
        { date: '12/05/26', fatigueScore: '79%', riskLevelKey: 'supervisor.common.high' },
        { date: '10/05/26', fatigueScore: '84%', riskLevelKey: 'supervisor.common.high' },
        { date: '12/06/26', fatigueScore: '34%', riskLevelKey: 'supervisor.common.low' }
      ]
    },
    {
      id: 2,
      name: 'Persona B.',
      role: 'Médico UCI',
      area: 'UCI',
      statusKey: 'supervisor.common.active',
      riskLabelKey: 'supervisor.riskStaff.veryHighRisk',
      riskBadgeKey: 'supervisor.riskStaff.veryHighRisk',
      riskBadgeClass: 'very-high',
      riskLevelKey: 'supervisor.common.veryHigh',
      shiftTime: '12 horas',
      evaluations: [
        { date: '11/05/26', fatigueScore: '91%', riskLevelKey: 'supervisor.common.veryHigh' },
        { date: '09/05/26', fatigueScore: '88%', riskLevelKey: 'supervisor.common.high' },
        { date: '07/05/26', fatigueScore: '80%', riskLevelKey: 'supervisor.common.high' }
      ]
    },
    {
      id: 3,
      name: 'Persona C.',
      role: 'Médico de emergencias',
      area: 'Emergencias',
      statusKey: 'supervisor.common.active',
      riskLabelKey: 'supervisor.riskStaff.moderateRisk',
      riskBadgeKey: 'supervisor.riskStaff.moderateRisk',
      riskBadgeClass: 'moderate',
      riskLevelKey: 'supervisor.common.moderate',
      shiftTime: '8 horas',
      evaluations: [
        { date: '08/05/26', fatigueScore: '58%', riskLevelKey: 'supervisor.common.moderate' },
        { date: '05/05/26', fatigueScore: '51%', riskLevelKey: 'supervisor.common.moderate' },
        { date: '01/05/26', fatigueScore: '34%', riskLevelKey: 'supervisor.common.low' }
      ]
    }
  ];

  selectedStaff: RiskStaffMember = this.staffMembers[0];

  get filteredStaff(): RiskStaffMember[] {
    const term = this.searchText.toLowerCase().trim();

    if (!term) return this.staffMembers;

    return this.staffMembers.filter(person =>
      person.name.toLowerCase().includes(term) ||
      person.role.toLowerCase().includes(term) ||
      person.area.toLowerCase().includes(term)
    );
  }

  selectStaff(person: RiskStaffMember): void {
    this.selectedStaff = person;
  }

  registerAction(): void {
    console.log('Registrar acción para:', this.selectedStaff.name);
  }
}
