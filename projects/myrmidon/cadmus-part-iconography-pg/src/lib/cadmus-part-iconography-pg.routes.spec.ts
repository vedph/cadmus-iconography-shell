import { pendingChangesGuard } from '@myrmidon/cadmus-core';
import {
  ICO_INSTRUCTIONS_PART_TYPEID,
  IcoInstructionsPartFeatureComponent,
} from '@myrmidon/cadmus-part-iconography-instructions';

import { CADMUS_PART_ICONOGRAPHY_PG_ROUTES } from './cadmus-part-iconography-pg.routes';

describe('CADMUS_PART_ICONOGRAPHY_PG_ROUTES', () => {
  it('should route instructions part to its feature editor', () => {
    expect(CADMUS_PART_ICONOGRAPHY_PG_ROUTES.length).toBe(1);
    const route = CADMUS_PART_ICONOGRAPHY_PG_ROUTES[0];
    expect(route.path).toBe(`${ICO_INSTRUCTIONS_PART_TYPEID}/:pid`);
    expect(route.pathMatch).toBe('full');
    expect(route.component).toBe(IcoInstructionsPartFeatureComponent);
    expect(route.canDeactivate).toEqual([pendingChangesGuard]);
  });

  it('should use a path whose prefix is the part type ID', () => {
    // EditPartFeatureBase extracts the type ID from the path before '/'
    const path = CADMUS_PART_ICONOGRAPHY_PG_ROUTES[0].path!;
    expect(path.substring(0, path.indexOf('/'))).toBe(
      ICO_INSTRUCTIONS_PART_TYPEID,
    );
  });
});
