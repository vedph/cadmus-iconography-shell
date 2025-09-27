import { Routes } from '@angular/router';

// cadmus
import { pendingChangesGuard } from '@myrmidon/cadmus-core';

import {
  ICO_INSTRUCTIONS_PART_TYPEID,
  IcoInstructionsPartFeatureComponent,
} from '@myrmidon/cadmus-part-iconography-instructions';

export const CADMUS_PART_ICONOGRAPHY_PG_ROUTES: Routes = [
  {
    path: `${ICO_INSTRUCTIONS_PART_TYPEID}/:pid`,
    pathMatch: 'full',
    component: IcoInstructionsPartFeatureComponent,
    canDeactivate: [pendingChangesGuard],
  },
];
