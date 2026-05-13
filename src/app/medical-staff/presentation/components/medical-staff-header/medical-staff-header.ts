import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-medical-staff-header',
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './medical-staff-header.html',
  styleUrl: './medical-staff-header.css'
})
export class MedicalStaffHeader {
}
