import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  effect,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';

import { FlatLookupPipe } from '@myrmidon/ngx-tools';
import { DialogService } from '@myrmidon/ngx-mat-tools';
import { Assertion, AssertionComponent } from '@myrmidon/cadmus-refs-assertion';
import {
  AssertedCompositeId,
  AssertedCompositeIdsComponent,
} from '@myrmidon/cadmus-refs-asserted-ids';
import {
  HistoricalDateComponent,
  HistoricalDateModel,
} from '@myrmidon/cadmus-refs-historical-date';

import { ThesaurusEntry } from '@myrmidon/cadmus-core';
import { Flag, FlagSetComponent } from '@myrmidon/cadmus-ui-flag-set';

import {
  IcoColorReuse,
  IcoInstruction,
  IcoInstructionDiff,
  TaggedString,
} from '../ico-instructions-part';
import { IcoInstructionDiffEditorComponent } from '../ico-instruction-diff-editor/ico-instruction-diff-editor.component';
import { IcoColorReuseEditorComponent } from '../ico-color-reuse-editor/ico-color-reuse-editor.component';

function entryToFlag(entry: ThesaurusEntry): Flag {
  return {
    id: entry.id,
    label: entry.value,
  };
}

@Component({
  selector: 'cadmus-ico-instructions-editor',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTabsModule,
    MatTooltipModule,
    AssertedCompositeIdsComponent,
    AssertionComponent,
    FlagSetComponent,
    HistoricalDateComponent,
    FlatLookupPipe,
    IcoInstructionDiffEditorComponent,
    IcoColorReuseEditorComponent,
  ],
  templateUrl: './ico-instruction-editor.component.html',
  styleUrl: './ico-instruction-editor.component.css',
})
export class IcoInstructionEditorComponent {
  public readonly instruction = model<IcoInstruction | undefined>();

  public readonly cancelEdit = output();

  // ico-instruction-type-tags
  public readonly instrTypeTagEntries = input<ThesaurusEntry[] | undefined>();
  // ico-instruction-types
  public readonly instrTypeEntries = input<ThesaurusEntry[] | undefined>();
  // ico-instruction-scripts
  public readonly instrScriptEntries = input<ThesaurusEntry[] | undefined>();
  // ico-instruction-positions
  public readonly instrPositionEntries = input<ThesaurusEntry[] | undefined>();
  // ico-instruction-diff-types
  public readonly instrDiffTypeEntries = input<ThesaurusEntry[] | undefined>();
  // ico-instruction-feats
  public readonly instrFeatEntries = input<ThesaurusEntry[] | undefined>();
  // ico-instruction-languages
  public readonly instrLanguageEntries = input<ThesaurusEntry[] | undefined>();
  // ico-instruction-tools
  public readonly instrToolEntries = input<ThesaurusEntry[] | undefined>();
  // ico-instruction-colors
  public readonly instrColorEntries = input<ThesaurusEntry[] | undefined>();
  // assertion-tags
  public readonly assTagEntries = input<ThesaurusEntry[] | undefined>();
  // doc-reference-types
  public readonly docRefTypeEntries = input<ThesaurusEntry[] | undefined>();
  // doc-reference-tags
  public readonly docRefTagEntries = input<ThesaurusEntry[] | undefined>();
  // asserted-id-scopes
  public readonly assIdScopeEntries = input<ThesaurusEntry[] | undefined>();
  // asserted-id-tags
  public readonly assIdTagEntries = input<ThesaurusEntry[] | undefined>();

  // flags mapped from thesaurus entries
  public languageFlags = computed<Flag[]>(
    () => this.instrLanguageEntries()?.map((e) => entryToFlag(e)) || []
  );
  public featureFlags = computed<Flag[]>(
    () => this.instrFeatEntries()?.map((e) => entryToFlag(e)) || []
  );
  public toolFlags = computed<Flag[]>(
    () => this.instrToolEntries()?.map((e) => entryToFlag(e)) || []
  );
  public colorFlags = computed<Flag[]>(
    () => this.instrColorEntries()?.map((e) => entryToFlag(e)) || []
  );

  public readonly editedDiff = signal<IcoInstructionDiff | undefined>(
    undefined
  );
  public readonly editedDiffIndex = signal<number>(-1);

  public readonly editedReuse = signal<IcoColorReuse | undefined>(undefined);
  public readonly editedReuseIndex = signal<number>(-1);

  // type form
  public type: FormControl<string>;
  public typeTag: FormControl<string | null>;
  public typeForm: FormGroup;

  // form
  public eid: FormControl<string | null>;
  public types: FormControl<TaggedString[]>;
  public subject: FormControl<string | null>;
  public script: FormControl<string | null>;
  public text: FormControl<string | null>;
  public sequences: FormControl<string | null>;
  public repertoire: FormControl<string | null>;
  public location: FormControl<string>;
  public position: FormControl<string>;
  public positionNote: FormControl<string | null>;
  public targetLocation: FormControl<string | null>;
  public implementation: FormControl<string | null>;
  public differences: FormControl<IcoInstructionDiff[]>;
  public note: FormControl<string | null>;
  public description: FormControl<string | null>;
  public features: FormControl<string[]>;
  public languages: FormControl<string[]>;
  public tools: FormControl<string[]>;
  public colors: FormControl<string[]>;
  public colorReuses: FormControl<IcoColorReuse[]>;
  public links: FormControl<AssertedCompositeId[]>;
  public hasDate: FormControl<boolean>;
  public date: FormControl<HistoricalDateModel | null>;
  public assertion: FormControl<Assertion | null>;
  public form: FormGroup;

  constructor(formBuilder: FormBuilder, private _dialogService: DialogService) {
    // type form
    this.type = new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    });
    this.typeTag = new FormControl<string | null>(null, {
      nonNullable: false,
      validators: Validators.maxLength(100),
    });
    this.typeForm = formBuilder.group({
      type: this.type,
      typeTag: this.typeTag,
    });

    // form
    this.eid = new FormControl<string | null>(null, Validators.maxLength(100));
    this.types = new FormControl<TaggedString[]>([], {
      nonNullable: true,
      validators: Validators.required,
    });
    this.subject = new FormControl<string | null>(
      null,
      Validators.maxLength(500)
    );
    this.script = new FormControl<string | null>(null, {
      nonNullable: true,
      validators: Validators.required,
    });
    this.text = new FormControl<string | null>(
      null,
      Validators.maxLength(5000)
    );
    this.sequences = new FormControl<string | null>(null);
    this.repertoire = new FormControl<string | null>(
      null,
      Validators.maxLength(100)
    );
    this.location = new FormControl<string>('', {
      nonNullable: true,
      validators: Validators.maxLength(100),
    });
    this.position = new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    });
    this.positionNote = new FormControl<string | null>(
      null,
      Validators.maxLength(1000)
    );
    this.targetLocation = new FormControl<string | null>(
      null,
      Validators.maxLength(100)
    );
    this.implementation = new FormControl<string | null>(
      null,
      Validators.maxLength(5000)
    );
    this.differences = new FormControl<IcoInstructionDiff[]>([], {
      nonNullable: true,
    });
    this.note = new FormControl<string | null>(
      null,
      Validators.maxLength(5000)
    );
    this.description = new FormControl<string | null>(
      null,
      Validators.maxLength(5000)
    );
    this.features = new FormControl<string[]>([], { nonNullable: true });
    this.languages = new FormControl<string[]>([], { nonNullable: true });
    this.tools = new FormControl<string[]>([], { nonNullable: true });
    this.colors = new FormControl<string[]>([], { nonNullable: true });
    this.colorReuses = new FormControl<IcoColorReuse[]>([], {
      nonNullable: true,
    });
    this.links = new FormControl<AssertedCompositeId[]>([], {
      nonNullable: true,
    });
    this.hasDate = new FormControl<boolean>(false, { nonNullable: true });
    this.date = new FormControl<HistoricalDateModel | null>(null);
    this.assertion = new FormControl<Assertion | null>(null);

    this.form = formBuilder.group({
      eid: this.eid,
      types: this.types,
      subject: this.subject,
      script: this.script,
      text: this.text,
      sequences: this.sequences,
      repertoire: this.repertoire,
      location: this.location,
      position: this.position,
      positionNote: this.positionNote,
      targetLocation: this.targetLocation,
      implementation: this.implementation,
      differences: this.differences,
      note: this.note,
      description: this.description,
      features: this.features,
      languages: this.languages,
      tools: this.tools,
      colors: this.colors,
      colorReuses: this.colorReuses,
      links: this.links,
      hasDate: this.hasDate,
      date: this.date,
      assertion: this.assertion,
    });

    // when model changes, update form
    effect(() => {
      const data = this.instruction();
      this.updateForm(data);
    });
  }

  private updateForm(instruction: IcoInstruction | undefined | null): void {
    if (!instruction) {
      this.form.reset();
    } else {
      this.eid.setValue(instruction.eid || null);
      this.types.setValue(instruction.types || []);
      this.subject.setValue(instruction.subject || null);
      this.script.setValue(instruction.script || null);
      this.text.setValue(instruction.text || null);
      // sequences are in a string with space separator
      this.sequences.setValue(
        instruction.sequences?.length ? instruction.sequences.join(' ') : null
      );
      this.repertoire.setValue(instruction.repertoire || null);
      this.location.setValue(instruction.location || '');
      this.position.setValue(instruction.position || '');
      this.positionNote.setValue(instruction.positionNote || null);
      this.targetLocation.setValue(instruction.targetLocation || null);
      this.implementation.setValue(instruction.implementation || null);
      this.differences.setValue(instruction.differences || []);
      this.note.setValue(instruction.note || null);
      this.description.setValue(instruction.description || null);
      this.features.setValue(instruction.features || []);
      this.languages.setValue(instruction.languages || []);
      this.tools.setValue(instruction.tools || []);
      this.colors.setValue(instruction.colors || []);
      this.colorReuses.setValue(instruction.colorReuses || []);
      this.links.setValue(instruction.links || []);
      this.hasDate.setValue(instruction.date ? true : false);
      this.date.setValue(instruction.date || null);
      this.assertion.setValue(instruction.assertion || null);
      this.form.markAsPristine();
    }
  }

  //#region Types
  public addType(): void {
    if (this.typeForm.invalid) {
      this.typeForm.markAllAsTouched();
      return;
    }
    const types = [...this.types.value];
    types.push({
      value: this.type.value.trim(),
      tag: this.typeTag.value?.trim() || undefined,
    });
    this.types.setValue(types);
    this.types.markAsDirty();
    this.types.updateValueAndValidity();
    this.typeForm.reset();
  }

  public deleteType(index: number): void {
    const types = [...this.types.value];
    types.splice(index, 1);
    this.types.setValue(types);
    this.types.markAsDirty();
    this.types.updateValueAndValidity();
  }

  public moveTypeUp(index: number): void {
    if (index < 1) {
      return;
    }
    const type = this.types.value[index];
    const types = [...this.types.value];
    types.splice(index, 1);
    types.splice(index - 1, 0, type);
    this.types.setValue(types);
    this.types.markAsDirty();
    this.types.updateValueAndValidity();
  }

  public moveTypeDown(index: number): void {
    if (index + 1 >= this.types.value.length) {
      return;
    }
    const type = this.types.value[index];
    const types = [...this.types.value];
    types.splice(index, 1);
    types.splice(index + 1, 0, type);
    this.types.setValue(types);
    this.types.markAsDirty();
    this.types.updateValueAndValidity();
  }
  //#endregion

  //#region Diffs
  public addDiff(): void {
    const entry: IcoInstructionDiff = {
      type: this.instrDiffTypeEntries()?.length
        ? this.instrDiffTypeEntries()![0].id
        : '',
    };
    this.editDiff(entry, -1);
  }

  public editDiff(entry: IcoInstructionDiff, index: number): void {
    this.editedDiffIndex.set(index);
    this.editedDiff.set(structuredClone(entry));
  }

  public closeDiff(): void {
    this.editedDiffIndex.set(-1);
    this.editedDiff.set(undefined);
  }

  public saveDiff(entry: IcoInstructionDiff): void {
    const differences = [...this.differences.value];
    if (this.editedDiffIndex() === -1) {
      differences.push(entry);
    } else {
      differences.splice(this.editedDiffIndex(), 1, entry);
    }
    this.differences.setValue(differences);
    this.differences.markAsDirty();
    this.differences.updateValueAndValidity();
    this.closeDiff();
  }

  public deleteDiff(index: number): void {
    this._dialogService
      .confirm('Confirmation', `Delete diff #${index + 1}?`)
      .subscribe((yes: boolean | undefined) => {
        if (yes) {
          if (this.editedDiffIndex() === index) {
            this.closeDiff();
          }
          const differences = [...this.differences.value];
          differences.splice(index, 1);
          this.differences.setValue(differences);
          this.differences.markAsDirty();
          this.differences.updateValueAndValidity();
        }
      });
  }

  public moveDiffUp(index: number): void {
    if (index < 1) {
      return;
    }
    const difference = this.differences.value[index];
    const differences = [...this.differences.value];
    differences.splice(index, 1);
    differences.splice(index - 1, 0, difference);
    this.differences.setValue(differences);
    this.differences.markAsDirty();
    this.differences.updateValueAndValidity();
  }

  public moveDiffDown(index: number): void {
    if (index + 1 >= this.differences.value.length) {
      return;
    }
    const difference = this.differences.value[index];
    const differences = [...this.differences.value];
    differences.splice(index, 1);
    differences.splice(index + 1, 0, difference);
    this.differences.setValue(differences);
    this.differences.markAsDirty();
    this.differences.updateValueAndValidity();
  }
  //#endregion

  //#region Color Reuses
  public addColorReuse(): void {
    const entry: IcoColorReuse = {
      color: this.instrColorEntries()?.length
        ? this.instrColorEntries()![0].id
        : '',
      location: '',
    };
    this.editColorReuse(entry, -1);
  }

  public editColorReuse(entry: IcoColorReuse, index: number): void {
    this.editedReuseIndex.set(index);
    this.editedReuse.set(structuredClone(entry));
  }

  public closeColorReuse(): void {
    this.editedReuseIndex.set(-1);
    this.editedReuse.set(undefined);
  }

  public saveColorReuse(entry: IcoColorReuse): void {
    const entries = [...this.colorReuses.value];
    if (this.editedReuseIndex() === -1) {
      entries.push(entry);
    } else {
      entries.splice(this.editedReuseIndex(), 1, entry);
    }
    this.colorReuses.setValue(entries);
    this.colorReuses.markAsDirty();
    this.colorReuses.updateValueAndValidity();
    this.closeColorReuse();
  }

  public deleteColorReuse(index: number): void {
    this._dialogService
      .confirm('Confirmation', `Delete color reuse #${index + 1}?`)
      .subscribe((yes: boolean | undefined) => {
        if (yes) {
          if (this.editedReuseIndex() === index) {
            this.closeColorReuse();
          }
          const entries = [...this.colorReuses.value];
          entries.splice(index, 1);
          this.colorReuses.setValue(entries);
          this.colorReuses.markAsDirty();
          this.colorReuses.updateValueAndValidity();
        }
      });
  }

  public moveColorReuseUp(index: number): void {
    if (index < 1) {
      return;
    }
    const entry = this.colorReuses.value[index];
    const entries = [...this.colorReuses.value];
    entries.splice(index, 1);
    entries.splice(index - 1, 0, entry);
    this.colorReuses.setValue(entries);
    this.colorReuses.markAsDirty();
    this.colorReuses.updateValueAndValidity();
  }

  public moveColorReuseDown(index: number): void {
    if (index + 1 >= this.colorReuses.value.length) {
      return;
    }
    const entry = this.colorReuses.value[index];
    const entries = [...this.colorReuses.value];
    entries.splice(index, 1);
    entries.splice(index + 1, 0, entry);
    this.colorReuses.setValue(entries);
    this.colorReuses.markAsDirty();
    this.colorReuses.updateValueAndValidity();
  }
  //#endregion

  public onLanguageCheckedIdsChange(ids: string[]): void {
    this.languages.setValue(ids);
    this.languages.markAsDirty();
    this.languages.updateValueAndValidity();
  }

  public onFeatureCheckedIdsChange(ids: string[]): void {
    this.features.setValue(ids);
    this.features.markAsDirty();
    this.features.updateValueAndValidity();
  }

  public onToolCheckedIdsChange(ids: string[]): void {
    this.tools.setValue(ids);
    this.tools.markAsDirty();
    this.tools.updateValueAndValidity();
  }

  public onColorCheckedIdsChange(ids: string[]): void {
    this.colors.setValue(ids);
    this.colors.markAsDirty();
    this.colors.updateValueAndValidity();
  }

  public onDateChange(date: HistoricalDateModel | null): void {
    this.date.setValue(date);
    this.date.markAsDirty();
    this.date.updateValueAndValidity();
  }

  public onAssertionChange(assertion: Assertion | null): void {
    this.assertion.setValue(assertion);
    this.assertion.markAsDirty();
    this.assertion.updateValueAndValidity();
  }

  private getInstruction(): IcoInstruction {
    const sequences = this.sequences.value?.trim()?.split(' ') || [];

    return {
      eid: this.eid.value || undefined,
      types: this.types.value,
      subject: this.subject.value || undefined,
      script: this.script.value || '',
      text: this.text.value || undefined,
      sequences: sequences.length ? sequences : undefined,
      repertoire: this.repertoire.value || undefined,
      location: this.location.value || '',
      position: this.position.value || '',
      positionNote: this.positionNote.value || undefined,
      targetLocation: this.targetLocation.value || undefined,
      implementation: this.implementation.value || undefined,
      differences: this.differences.value?.length
        ? this.differences.value
        : undefined,
      note: this.note.value || undefined,
      description: this.description.value || undefined,
      features: this.features.value?.length ? this.features.value : undefined,
      languages: this.languages.value?.length
        ? this.languages.value
        : undefined,
      tools: this.tools.value?.length ? this.tools.value : undefined,
      colors: this.colors.value?.length ? this.colors.value : undefined,
      colorReuses: this.colorReuses.value?.length
        ? this.colorReuses.value
        : undefined,
      links: this.links.value?.length ? this.links.value : undefined,
      date: this.hasDate.value && this.date.value ? this.date.value : undefined,
      assertion: this.assertion.value || undefined,
    };
  }

  public cancel(): void {
    this.cancelEdit.emit();
  }

  /**
   * Saves the current form data by updating the `data` model signal.
   * This method can be called manually (e.g., by a Save button) or
   * automatically (via auto-save).
   * @param pristine If true (default), the form is marked as pristine
   * after saving.
   * Set to false for auto-save if you want the form to remain dirty.
   */
  public save(pristine = true): void {
    if (this.form.invalid) {
      // show validation errors
      this.form.markAllAsTouched();
      return;
    }

    const data = this.getInstruction();
    this.instruction.set(data);

    if (pristine) {
      this.form.markAsPristine();
    }
  }
}
