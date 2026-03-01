
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterModule } from '@angular/router';

import { MatCardModule } from '@angular/material/card';

import { AuthJwtService } from '@myrmidon/auth-jwt-login';

@Component({
  selector: 'cadmus-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule, MatCardModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent {
  public readonly logged = signal<boolean>(false);

  constructor(authService: AuthJwtService) {
    this.logged.set(authService.currentUserValue !== null);
  }
}
