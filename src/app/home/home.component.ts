import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { MatCardModule } from '@angular/material/card';

import { AuthJwtService } from '@myrmidon/auth-jwt-login';

@Component({
  selector: 'cadmus-home',
  imports: [CommonModule, RouterModule, MatCardModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent {
  public logged: boolean;

  constructor(authService: AuthJwtService) {
    this.logged = authService.currentUserValue !== null;
  }
}
