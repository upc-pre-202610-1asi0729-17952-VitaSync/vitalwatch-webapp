import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-supervisor-header',
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './supervisor-header.html',
  styleUrl: './supervisor-header.css'
})
export class SupervisorHeader {
}
