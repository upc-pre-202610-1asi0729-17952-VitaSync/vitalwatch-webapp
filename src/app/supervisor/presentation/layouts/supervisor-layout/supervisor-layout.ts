import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SupervisorHeader } from '../../components/supervisor-header/supervisor-header';

@Component({
  selector: 'app-supervisor-layout',
  imports: [RouterOutlet, SupervisorHeader],
  templateUrl: './supervisor-layout.html',
  styleUrl: './supervisor-layout.css'
})
export class SupervisorLayout {
}
