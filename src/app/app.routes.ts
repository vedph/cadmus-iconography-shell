import { Routes } from '@angular/router';

// myrmidon
import { jwtAdminGuard, jwtGuard } from '@myrmidon/auth-jwt-login';
import { pendingChangesGuard } from '@myrmidon/cadmus-core';
import { EditorGuardService } from '@myrmidon/cadmus-api';

// locals
import { HomeComponent } from './home/home.component';
import { ManageUsersPageComponent } from './manage-users-page/manage-users-page.component';
import { RegisterUserPageComponent } from './register-user-page/register-user-page.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { LoginPageComponent } from './login-page/login-page.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  // auth
  { path: 'login', component: LoginPageComponent },
  {
    path: 'reset-password',
    component: ResetPasswordComponent,
    canActivate: [jwtGuard],
  },
  {
    path: 'register-user',
    component: RegisterUserPageComponent,
    canActivate: [jwtAdminGuard],
  },
  {
    path: 'manage-users',
    component: ManageUsersPageComponent,
    canActivate: [jwtAdminGuard],
  },
  // cadmus - items
  {
    path: 'items/:id',
    loadComponent: () =>
      import('@myrmidon/cadmus-item-editor').then(
        (module) => module.ItemEditorComponent
      ),
    canActivate: [jwtGuard],
    canDeactivate: [pendingChangesGuard],
  },
  {
    path: 'items',
    loadComponent: () =>
      import('@myrmidon/cadmus-item-list').then(
        (module) => module.ItemListComponent
      ),
    canActivate: [jwtGuard],
  },
  {
    path: 'search',
    loadComponent: () =>
      import('@myrmidon/cadmus-item-search').then(
        (module) => module.ItemSearchComponent
      ),
    canActivate: [jwtGuard],
  },
  // cadmus - thesauri
  {
    path: 'thesauri/:id',
    loadComponent: () =>
      import('@myrmidon/cadmus-thesaurus-editor').then(
        (module) => module.ThesaurusEditorFeatureComponent
      ),
    canActivate: [EditorGuardService],
  },
  {
    path: 'thesauri',
    loadComponent: () =>
      import('@myrmidon/cadmus-thesaurus-list').then(
        (module) => module.ThesaurusListComponent
      ),
    canActivate: [EditorGuardService],
  },
  // cadmus - preview
  {
    path: 'preview',
    loadChildren: () =>
      import('@myrmidon/cadmus-preview-pg').then(
        (module) => module.CADMUS_PART_PREVIEW_PG_ROUTES
      ),
    canActivate: [jwtGuard],
  },
  // cadmus - flags
  {
    path: 'flags',
    loadComponent: () =>
      import('@myrmidon/cadmus-flags-pg').then(
        (module) => module.FlagsEditorFeatureComponent
      ),
    canActivate: [jwtGuard],
  },
  // cadmus - parts
  {
    path: 'items/:iid/general',
    loadChildren: () =>
      import('@myrmidon/cadmus-part-general-pg').then(
        (module) => module.CADMUS_PART_GENERAL_ROUTES
      ),
    canActivate: [jwtGuard],
  },
  {
    path: 'items/:iid/iconography',
    loadChildren: () =>
      import('@myrmidon/cadmus-part-iconography-pg').then(
        (module) => module.CADMUS_PART_ICONOGRAPHY_PG_ROUTES
      ),
    canActivate: [jwtGuard],
  },
  // fallback
  { path: '**', component: HomeComponent },
];
