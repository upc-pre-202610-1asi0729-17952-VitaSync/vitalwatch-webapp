import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MedicalStaffHeader } from '../../components/medical-staff-header/medical-staff-header';

@Component({
  selector: 'app-medical-staff-layout',
  imports: [RouterOutlet, MedicalStaffHeader],
  templateUrl: './medical-staff-layout.html',
  styleUrl: './medical-staff-layout.css'
})
export class MedicalStaffLayout {
}
