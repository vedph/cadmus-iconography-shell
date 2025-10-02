import { Component, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  UntypedFormGroup,
} from '@angular/forms';

import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AuthJwtService } from '@myrmidon/auth-jwt-login';

import { FlatLookupPipe, NgxToolsValidators } from '@myrmidon/ngx-tools';
import {
  CloseSaveButtonsComponent,
  ModelEditorComponentBase,
} from '@myrmidon/cadmus-ui';
import {
  EditedObject,
  ThesauriSet,
  ThesaurusEntry,
} from '@myrmidon/cadmus-core';
import { DialogService } from '@myrmidon/ngx-mat-tools';

import {
  ICO_INSTRUCTIONS_PART_TYPEID,
  IcoInstruction,
  IcoInstructionsPart,
} from '../ico-instructions-part';
import { IcoInstructionEditorComponent } from '../ico-instructions-editor/ico-instruction-editor.component';

/**
 * Iconographic instructions part editor component.
 * Thesauri: ico-instruction-types, ico-instruction-type-tags, ico-instruction-scripts,
 * ico-instruction-diff-types, ico-instruction-positions, ico-instruction-feats,
 * ico-instruction-languages, ico-instruction-tools,
 * ico-instruction-colors, assertion-tags, doc-reference-types,
 * doc-reference-tags, asserted-id-scopes, asserted-id-tags (all optional).
 */
@Component({
  selector: 'cadmus-ico-instructions-part',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    // cadmus
    CloseSaveButtonsComponent,
    FlatLookupPipe,
    IcoInstructionEditorComponent,
  ],
  templateUrl: './ico-instructions-part.component.html',
  styleUrl: './ico-instructions-part.component.css',
})
export class IcoInstructionsPartComponent
  extends ModelEditorComponentBase<IcoInstructionsPart>
  implements OnInit
{
  public readonly editedIndex = signal<number>(-1);
  public readonly edited = signal<IcoInstruction | undefined>(undefined);

  // ico-instruction-types
  public readonly instrTypeEntries = signal<ThesaurusEntry[] | undefined>(
    undefined
  );
  // ico-instruction-type-tags
  public readonly instrTypeTagEntries = signal<ThesaurusEntry[] | undefined>(
    undefined
  );
  // ico-instruction-scripts
  public readonly instrScriptEntries = signal<ThesaurusEntry[] | undefined>(
    undefined
  );
  // ico-instruction-diff-types
  public readonly instrDiffTypeEntries = signal<ThesaurusEntry[] | undefined>(
    undefined
  );
  // ico-instruction-positions
  public readonly instrPositionEntries = signal<ThesaurusEntry[] | undefined>(
    undefined
  );
  // ico-instruction-feats
  public readonly instrFeatEntries = signal<ThesaurusEntry[] | undefined>(
    undefined
  );
  // ico-instruction-languages
  public readonly instrLangEntries = signal<ThesaurusEntry[] | undefined>(
    undefined
  );
  // ico-instruction-tools
  public readonly instrToolEntries = signal<ThesaurusEntry[] | undefined>(
    undefined
  );
  // ico-instruction-colors
  public readonly instrColorEntries = signal<ThesaurusEntry[] | undefined>(
    undefined
  );
  // assertion-tags
  public readonly assTagEntries = signal<ThesaurusEntry[] | undefined>(
    undefined
  );
  // doc-reference-types
  public readonly docRefTypeEntries = signal<ThesaurusEntry[] | undefined>(
    undefined
  );
  // doc-reference-tags
  public readonly docRefTagEntries = signal<ThesaurusEntry[] | undefined>(
    undefined
  );
  // asserted-id-scopes
  public readonly assIdScopeEntries = signal<ThesaurusEntry[] | undefined>(
    undefined
  );
  // asserted-id-tags
  public readonly assIdTagEntries = signal<ThesaurusEntry[] | undefined>(
    undefined
  );

  public instructions: FormControl<IcoInstruction[]>;

  constructor(
    authService: AuthJwtService,
    formBuilder: FormBuilder,
    private _dialogService: DialogService
  ) {
    super(authService, formBuilder);
    // form
    this.instructions = formBuilder.control([], {
      // at least 1 entry
      validators: NgxToolsValidators.strictMinLengthValidator(1),
      nonNullable: true,
    });
  }

  public override ngOnInit(): void {
    super.ngOnInit();
  }

  protected buildForm(formBuilder: FormBuilder): FormGroup | UntypedFormGroup {
    return formBuilder.group({
      entries: this.instructions,
    });
  }

  private updateThesauri(thesauri: ThesauriSet): void {
    let key = 'ico-instruction-types';
    if (this.hasThesaurus(key)) {
      this.instrTypeEntries.set(thesauri[key].entries);
    } else {
      this.instrTypeEntries.set(undefined);
    }
    key = 'ico-instruction-type-tags';
    if (this.hasThesaurus(key)) {
      this.instrTypeTagEntries.set(thesauri[key].entries);
    } else {
      this.instrTypeTagEntries.set(undefined);
    }
    key = 'ico-instruction-scripts';
    if (this.hasThesaurus(key)) {
      this.instrScriptEntries.set(thesauri[key].entries);
    } else {
      this.instrScriptEntries.set(undefined);
    }
    key = 'ico-instruction-positions';
    if (this.hasThesaurus(key)) {
      this.instrPositionEntries.set(thesauri[key].entries);
    } else {
      this.instrPositionEntries.set(undefined);
    }
    key = 'ico-instruction-diff-types';
    if (this.hasThesaurus(key)) {
      this.instrDiffTypeEntries.set(thesauri[key].entries);
    } else {
      this.instrDiffTypeEntries.set(undefined);
    }
    key = 'ico-instruction-feats';
    if (this.hasThesaurus(key)) {
      this.instrFeatEntries.set(thesauri[key].entries);
    } else {
      this.instrFeatEntries.set(undefined);
    }
    key = 'ico-instruction-languages';
    if (this.hasThesaurus(key)) {
      this.instrLangEntries.set(thesauri[key].entries);
    } else {
      this.instrLangEntries.set(undefined);
    }
    key = 'ico-instruction-tools';
    if (this.hasThesaurus(key)) {
      this.instrToolEntries.set(thesauri[key].entries);
    } else {
      this.instrToolEntries.set(undefined);
    }
    key = 'ico-instruction-colors';
    if (this.hasThesaurus(key)) {
      this.instrColorEntries.set(thesauri[key].entries);
    } else {
      this.instrColorEntries.set(undefined);
    }
    key = 'assertion-tags';
    if (this.hasThesaurus(key)) {
      this.assTagEntries.set(thesauri[key].entries);
    } else {
      this.assTagEntries.set(undefined);
    }
    key = 'doc-reference-types';
    if (this.hasThesaurus(key)) {
      this.docRefTypeEntries.set(thesauri[key].entries);
    } else {
      this.docRefTypeEntries.set(undefined);
    }
    key = 'doc-reference-tags';
    if (this.hasThesaurus(key)) {
      this.docRefTagEntries.set(thesauri[key].entries);
    } else {
      this.docRefTagEntries.set(undefined);
    }
    key = 'asserted-id-scopes';
    if (this.hasThesaurus(key)) {
      this.assIdScopeEntries.set(thesauri[key].entries);
    } else {
      this.assIdScopeEntries.set(undefined);
    }
    key = 'asserted-id-tags';
    if (this.hasThesaurus(key)) {
      this.assIdTagEntries.set(thesauri[key].entries);
    } else {
      this.assIdTagEntries.set(undefined);
    }
  }

  private updateForm(part?: IcoInstructionsPart | null): void {
    if (!part) {
      this.form.reset();
      return;
    }
    this.instructions.setValue(part.instructions || []);
    this.form.markAsPristine();
  }

  protected override onDataSet(data?: EditedObject<IcoInstructionsPart>): void {
    // thesauri
    if (data?.thesauri) {
      this.updateThesauri(data.thesauri);
    }

    // form
    this.updateForm(data?.value);
  }

  protected getValue(): IcoInstructionsPart {
    let part = this.getEditedPart(
      ICO_INSTRUCTIONS_PART_TYPEID
    ) as IcoInstructionsPart;
    part.instructions = this.instructions.value || [];
    return part;
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
    this.edited.set(structuredClone(instruction));
  }

  public closeInstruction(): void {
    this.editedIndex.set(-1);
    this.edited.set(undefined);
  }

  public saveInstruction(instruction: IcoInstruction): void {
    const instructions = [...this.instructions.value];
    if (this.editedIndex() === -1) {
      instructions.push(instruction);
    } else {
      instructions.splice(this.editedIndex(), 1, instruction);
    }
    this.instructions.setValue(instructions);
    this.instructions.markAsDirty();
    this.instructions.updateValueAndValidity();
    this.closeInstruction();
  }

  public deleteInstruction(index: number): void {
    this._dialogService
      .confirm('Confirmation', 'Delete instruction?')
      .subscribe((yes: boolean | undefined) => {
        if (yes) {
          if (this.editedIndex() === index) {
            this.closeInstruction();
          }
          const instructions = [...this.instructions.value];
          instructions.splice(index, 1);
          this.instructions.setValue(instructions);
          this.instructions.markAsDirty();
          this.instructions.updateValueAndValidity();
        }
      });
  }

  public moveInstructionUp(index: number): void {
    if (index < 1) {
      return;
    }
    const instruction = this.instructions.value[index];
    const instructions = [...this.instructions.value];
    instructions.splice(index, 1);
    instructions.splice(index - 1, 0, instruction);
    this.instructions.setValue(instructions);
    this.instructions.markAsDirty();
    this.instructions.updateValueAndValidity();
  }

  public moveInstructionDown(index: number): void {
    if (index + 1 >= this.instructions.value.length) {
      return;
    }
    const instruction = this.instructions.value[index];
    const instructions = [...this.instructions.value];
    instructions.splice(index, 1);
    instructions.splice(index + 1, 0, instruction);
    this.instructions.setValue(instructions);
    this.instructions.markAsDirty();
    this.instructions.updateValueAndValidity();
  }
}
