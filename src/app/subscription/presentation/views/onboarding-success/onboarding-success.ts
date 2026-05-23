import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-onboarding-success',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './onboarding-success.html',
  styleUrl: './onboarding-success.css'
})
export class OnboardingSuccess {

}