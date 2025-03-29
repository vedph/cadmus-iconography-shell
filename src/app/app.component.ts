import { CommonModule } from '@angular/common';
import { Component, OnInit, Inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { take } from 'rxjs/operators';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { EnvService } from '@myrmidon/ngx-tools';
import { AuthJwtService, GravatarPipe, User } from '@myrmidon/auth-jwt-login';

import { Thesaurus, ThesaurusEntry } from '@myrmidon/cadmus-core';
import { AppRepository } from '@myrmidon/cadmus-state';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatToolbarModule,
    MatTooltipModule,
    GravatarPipe,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  public user?: User;
  public logged?: boolean;
  public itemBrowsers?: ThesaurusEntry[];
  public version?: string;

  constructor(
    @Inject('itemBrowserKeys')
    private _itemBrowserKeys: { [key: string]: string },
    private _authService: AuthJwtService,
    private _repository: AppRepository,
    private _router: Router,
    env: EnvService
  ) {
    this.version = env.get('version');
  }

  ngOnInit(): void {
    this.user = this._authService.currentUserValue || undefined;
    this.logged = this.user !== null;

    this._authService.currentUser$.subscribe((user: User | null) => {
      this.logged = this._authService.isAuthenticated(true);
      this.user = user || undefined;
      // load the general app state just once
      if (user) {
        this._repository.load();
      }
    });

    this._repository.itemBrowserThesaurus$.subscribe(
      (thesaurus: Thesaurus | undefined) => {
        this.itemBrowsers = thesaurus ? thesaurus.entries : undefined;
      }
    );
  }

  public getItemBrowserRoute(id: string): string {
    return this._itemBrowserKeys[id] || id;
  }

  public logout(): void {
    if (!this.logged) {
      return;
    }
    this._authService
      .logout()
      .pipe(take(1))
      .subscribe((_) => {
        this._router.navigate(['/home']);
      });
  }
}
