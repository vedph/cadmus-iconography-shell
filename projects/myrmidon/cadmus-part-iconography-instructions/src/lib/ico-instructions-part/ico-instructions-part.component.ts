import { Component, OnInit } from '@angular/core';
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
  EditedObject,
  ModelEditorComponentBase,
} from '@myrmidon/cadmus-ui';
import { ThesauriSet, ThesaurusEntry } from '@myrmidon/cadmus-core';
import { DialogService } from '@myrmidon/ngx-mat-tools';

import {
  ICO_INSTRUCTIONS_PART_TYPEID,
  IcoInstruction,
  IcoInstructionsPart,
} from '../ico-instructions-part';

/**
 * Iconographic instructions part editor component.
 * Thesauri: ico-instruction-types, ico-instruction-scripts,
 * ico-instruction-positions, ico-instruction-feats,
 * ico-instruction-languages, ico-instruction-tools,
 * ico-instruction-colors, assertion-tags, doc-reference-types,
 * doc-reference-tags (all optional).
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
  ],
  templateUrl: './ico-instructions-part.component.html',
  styleUrl: './ico-instructions-part.component.css',
})
export class IcoInstructionsPartComponent
  extends ModelEditorComponentBase<IcoInstructionsPart>
  implements OnInit
{
  public editedIndex: number;
  public edited?: IcoInstruction;

  // ico-instruction-types
  public instrTypeEntries?: ThesaurusEntry[];
  // ico-instruction-scripts
  public instrScriptEntries?: ThesaurusEntry[];
  // ico-instruction-positions
  public instrPositionEntries?: ThesaurusEntry[];
  // ico-instruction-feats
  public instrFeatEntries?: ThesaurusEntry[];
  // ico-instruction-languages
  public instrLangEntries?: ThesaurusEntry[];
  // ico-instruction-tools
  public instrToolEntries?: ThesaurusEntry[];
  // ico-instruction-colors
  public instrColorEntries?: ThesaurusEntry[];
  // assertion-tags
  public assTagEntries?: ThesaurusEntry[];
  // doc-reference-types
  public docRefTypeEntries?: ThesaurusEntry[];
  // doc-reference-tags
  public docRefTagEntries?: ThesaurusEntry[];

  public instructions: FormControl<IcoInstruction[]>;

  constructor(
    authService: AuthJwtService,
    formBuilder: FormBuilder,
    private _dialogService: DialogService
  ) {
    super(authService, formBuilder);
    this.editedIndex = -1;
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
      this.instrTypeEntries = thesauri[key].entries;
    } else {
      this.instrTypeEntries = undefined;
    }
    key = 'ico-instruction-scripts';
    if (this.hasThesaurus(key)) {
      this.instrScriptEntries = thesauri[key].entries;
    } else {
      this.instrScriptEntries = undefined;
    }
    key = 'ico-instruction-positions';
    if (this.hasThesaurus(key)) {
      this.instrPositionEntries = thesauri[key].entries;
    } else {
      this.instrPositionEntries = undefined;
    }
    key = 'ico-instruction-feats';
    if (this.hasThesaurus(key)) {
      this.instrFeatEntries = thesauri[key].entries;
    } else {
      this.instrFeatEntries = undefined;
    }
    key = 'ico-instruction-languages';
    if (this.hasThesaurus(key)) {
      this.instrLangEntries = thesauri[key].entries;
    } else {
      this.instrLangEntries = undefined;
    }
    key = 'ico-instruction-tools';
    if (this.hasThesaurus(key)) {
      this.instrToolEntries = thesauri[key].entries;
    } else {
      this.instrToolEntries = undefined;
    }
    key = 'ico-instruction-colors';
    if (this.hasThesaurus(key)) {
      this.instrColorEntries = thesauri[key].entries;
    } else {
      this.instrColorEntries = undefined;
    }
    key = 'assertion-tags';
    if (this.hasThesaurus(key)) {
      this.assTagEntries = thesauri[key].entries;
    } else {
      this.assTagEntries = undefined;
    }
    key = 'doc-reference-types';
    if (this.hasThesaurus(key)) {
      this.docRefTypeEntries = thesauri[key].entries;
    } else {
      this.docRefTypeEntries = undefined;
    }
    key = 'doc-reference-tags';
    if (this.hasThesaurus(key)) {
      this.docRefTagEntries = thesauri[key].entries;
    } else {
      this.docRefTagEntries = undefined;
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
    this.editedIndex = index;
    this.edited = instruction;
  }

  public closeInstruction(): void {
    this.editedIndex = -1;
    this.edited = undefined;
  }

  public saveInstruction(instruction: IcoInstruction): void {
    const instructions = [...this.instructions.value];
    if (this.editedIndex === -1) {
      instructions.push(instruction);
    } else {
      instructions.splice(this.editedIndex, 1, instruction);
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
          if (this.editedIndex === index) {
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
