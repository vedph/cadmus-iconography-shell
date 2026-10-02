import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { FlatLookupPipe, NgxToolsSignalValidators } from '@myrmidon/ngx-tools';
import {
  CloseSaveButtonsComponent,
  copyFormValue,
  HelpLinkComponent,
  ModelEditorComponentBase,
} from '@myrmidon/cadmus-ui';
import { ThesaurusEntry } from '@myrmidon/cadmus-core';
import { DialogService } from '@myrmidon/ngx-mat-tools';
import { LookupProviderOptions } from '@myrmidon/cadmus-refs-lookup';

import {
  ICO_INSTRUCTIONS_PART_TYPEID,
  IcoInstruction,
  IcoInstructionsPart,
} from '../ico-instructions-part';
import { IcoInstructionEditorComponent } from '../ico-instruction-editor/ico-instruction-editor.component';

interface IcoInstructionsPartSettings {
  lookupProviderOptions?: LookupProviderOptions;
}

/**
 * The editable shape behind the part form.
 */
interface IcoInstructionsPartControls {
  instructions: IcoInstruction[];
}

function toDraft(part?: IcoInstructionsPart | null): IcoInstructionsPartControls {
  return { instructions: copyFormValue(part?.instructions || []) };
}

/**
 * Get the new position of the item at index after swapping the items
 * at indexes a and b.
 */
function swapIndex(index: number, a: number, b: number): number {
  if (index === a) {
    return b;
  }
  return index === b ? a : index;
}

/**
 * Get a copy of items where the item at index has been moved to newIndex.
 */
function moveItem<T>(items: T[], index: number, newIndex: number): T[] {
  const moved = [...items];
  moved.splice(newIndex, 0, ...moved.splice(index, 1));
  return moved;
}

/**
 * Iconographic instructions part editor component.
 * Thesauri: ico-instruction-types, ico-instruction-subjects, ico-instruction-type-tags,
 * ico-instruction-scripts, ico-instruction-diff-types, ico-instruction-positions,
 * ico-instruction-feats, ico-instruction-languages, ico-instruction-tools,
 * ico-instruction-colors, assertion-tags, doc-reference-types,
 * doc-reference-tags, asserted-id-scopes, asserted-id-tags, asserted-id-features
 * (all optional).
 */
@Component({
  selector: 'cadmus-ico-instructions-part',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatExpansionModule,
    MatIconModule,
    MatTooltipModule,
    // cadmus
    CloseSaveButtonsComponent,
    FlatLookupPipe,
    IcoInstructionEditorComponent,
    HelpLinkComponent
  ],
  templateUrl: './ico-instructions-part.component.html',
  styleUrl: './ico-instructions-part.component.css',
})
export class IcoInstructionsPartComponent extends ModelEditorComponentBase<IcoInstructionsPart> {
  private readonly _dialogService = inject(DialogService);

  public readonly editedIndex = signal<number>(-1);
  public readonly edited = signal<IcoInstruction | undefined>(undefined);

  // ico-instruction-types
  public readonly instrTypeEntries = this.entriesOf('ico-instruction-types');
  // ico-instruction-type-tags
  public readonly instrTypeTagEntries = this.entriesOf(
    'ico-instruction-type-tags',
  );
  // ico-instruction-subjects
  public readonly instrSubjectEntries = this.entriesOf(
    'ico-instruction-subjects',
  );
  // ico-instruction-scripts
  public readonly instrScriptEntries = this.entriesOf(
    'ico-instruction-scripts',
  );
  // ico-instruction-diff-types
  public readonly instrDiffTypeEntries = this.entriesOf(
    'ico-instruction-diff-types',
  );
  // ico-instruction-positions
  public readonly instrPositionEntries = this.entriesOf(
    'ico-instruction-positions',
  );
  // ico-instruction-feats
  public readonly instrFeatEntries = this.entriesOf('ico-instruction-feats');
  // ico-instruction-languages
  public readonly instrLangEntries = this.entriesOf(
    'ico-instruction-languages',
  );
  // ico-instruction-tools
  public readonly instrToolEntries = this.entriesOf('ico-instruction-tools');
  // ico-instruction-colors
  public readonly instrColorEntries = this.entriesOf('ico-instruction-colors');
  // assertion-tags
  public readonly assTagEntries = this.entriesOf('assertion-tags');
  // doc-reference-types
  public readonly docRefTypeEntries = this.entriesOf('doc-reference-types');
  // doc-reference-tags
  public readonly docRefTagEntries = this.entriesOf('doc-reference-tags');
  // asserted-id-scopes
  public readonly assIdScopeEntries = this.entriesOf('asserted-id-scopes');
  // asserted-id-tags
  public readonly assIdTagEntries = this.entriesOf('asserted-id-tags');
  // asserted-id-features
  public readonly assIdFeatureEntries = this.entriesOf('asserted-id-features');

  // lookup options depending on role
  public readonly lookupProviderOptions = signal<
    LookupProviderOptions | undefined
  >(undefined);

  private readonly _draft = linkedSignal(() => toDraft(this.data()?.value));
  public readonly form = this.createForm(this._draft, (p) => {
    // at least 1 entry
    NgxToolsSignalValidators.strictMinLength(p.instructions, 1);
  });

  constructor() {
    super();
    this.initSettings<IcoInstructionsPartSettings>(
      ICO_INSTRUCTIONS_PART_TYPEID,
      (settings) => {
        this.lookupProviderOptions.set(
          settings?.lookupProviderOptions || undefined,
        );
      },
    );
  }

  private entriesOf(key: string) {
    return computed<ThesaurusEntry[] | undefined>(
      () => this.data()?.thesauri?.[key]?.entries,
    );
  }

  protected getValue(): IcoInstructionsPart {
    const part = this.getEditedPart(
      ICO_INSTRUCTIONS_PART_TYPEID,
    ) as IcoInstructionsPart;
    part.instructions = copyFormValue(this._draft().instructions);
    return part;
  }

  /**
   * Set the instructions, as the effect of a user action.
   */
  private setInstructions(instructions: IcoInstruction[]): void {
    this.form.instructions().value.set(instructions);
    this.form.instructions().markAsDirty();
  }

  public addInstruction(): void {
    const entry: IcoInstruction = {
      types: [],
      location: '',
      script: '',
      position: '',
    };
    this.editInstruction(entry, -1);
  }

  public editInstruction(instruction: IcoInstruction, index: number): void {
    this.editedIndex.set(index);
    this.edited.set(copyFormValue(instruction));
  }

  public closeInstruction(): void {
    this.editedIndex.set(-1);
    this.edited.set(undefined);
  }

  public saveInstruction(instruction: IcoInstruction): void {
    const instructions = [...this.form.instructions().value()];
    if (this.editedIndex() === -1) {
      instructions.push(instruction);
    } else {
      instructions.splice(this.editedIndex(), 1, instruction);
    }
    this.setInstructions(instructions);
    this.closeInstruction();
  }

  public deleteInstruction(index: number): void {
    this._dialogService
      .confirm('Confirmation', 'Delete instruction?')
      .subscribe((yes: boolean | undefined) => {
        if (yes) {
          if (this.editedIndex() === index) {
            this.closeInstruction();
          } else if (this.editedIndex() > index) {
            // keep tracking the edited instruction, which shifted up
            this.editedIndex.update((i) => i - 1);
          }
          this.setInstructions(
            this.form.instructions().value().filter((_, i) => i !== index),
          );
        }
      });
  }

  public moveInstructionUp(index: number): void {
    if (index < 1) {
      return;
    }
    this.editedIndex.set(swapIndex(this.editedIndex(), index, index - 1));
    this.setInstructions(
      moveItem(this.form.instructions().value(), index, index - 1),
    );
  }

  public moveInstructionDown(index: number): void {
    if (index + 1 >= this.form.instructions().value().length) {
      return;
    }
    this.editedIndex.set(swapIndex(this.editedIndex(), index, index + 1));
    this.setInstructions(
      moveItem(this.form.instructions().value(), index, index + 1),
    );
  }
}
