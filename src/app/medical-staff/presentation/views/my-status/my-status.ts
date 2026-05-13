import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-my-status',
  imports: [TranslatePipe],
  templateUrl: './my-status.html',
  styleUrl: './my-status.css'
})
export class MyStatus {
  protected readonly lastUpdateMinutes = 8;
  protected readonly stepsToday = 3200;
}
