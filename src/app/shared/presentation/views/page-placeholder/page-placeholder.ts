import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-page-placeholder',
  imports: [TranslatePipe],
  templateUrl: './page-placeholder.html',
  styleUrl: './page-placeholder.css'
})
export class PagePlaceholder {
  private route = inject(ActivatedRoute);

  protected title = this.route.snapshot.data['title'] ?? 'navigation.general-summary';
}