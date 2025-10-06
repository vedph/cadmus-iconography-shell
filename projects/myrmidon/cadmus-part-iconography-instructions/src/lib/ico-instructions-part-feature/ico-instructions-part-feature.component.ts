import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, ActivatedRoute } from '@angular/router';

import { ItemService, ThesaurusService } from '@myrmidon/cadmus-api';
import { EditPartFeatureBase, PartEditorService } from '@myrmidon/cadmus-state';
import { CurrentItemBarComponent } from '@myrmidon/cadmus-ui-pg';

import { IcoInstructionsPartComponent } from '../ico-instructions-part/ico-instructions-part.component';

@Component({
  selector: 'cadmus-ico-instructions-part-feature',
  imports: [IcoInstructionsPartComponent, CurrentItemBarComponent],
  templateUrl: './ico-instructions-part-feature.component.html',
  styleUrl: './ico-instructions-part-feature.component.css',
})
export class IcoInstructionsPartFeatureComponent
  extends EditPartFeatureBase
  implements OnInit
{
  constructor(
    router: Router,
    route: ActivatedRoute,
    snackbar: MatSnackBar,
    itemService: ItemService,
    thesaurusService: ThesaurusService,
    editorService: PartEditorService
  ) {
    super(
      router,
      route,
      snackbar,
      itemService,
      thesaurusService,
      editorService
    );
  }

  protected override getReqThesauriIds(): string[] {
    return [
      'ico-instruction-types',
      'ico-instruction-type-tags',
      'ico-instruction-subjects',
      'ico-instruction-scripts',
      'ico-instruction-diff-types',
      'ico-instruction-positions',
      'ico-instruction-feats',
      'ico-instruction-languages',
      'ico-instruction-tools',
      'ico-instruction-colors',
      'assertion-tags',
      'doc-reference-types',
      'doc-reference-tags',
      'asserted-id-scopes',
      'asserted-id-tags',
    ];
  }
}
