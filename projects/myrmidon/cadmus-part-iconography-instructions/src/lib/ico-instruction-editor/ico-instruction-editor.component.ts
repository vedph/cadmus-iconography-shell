import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  model,
  output,
  signal,
  untracked,
} from '@angular/core';
import {
  FieldTree,
  form,
  FormField,
  maxLength,
  required,
} from '@angular/forms/signals';

import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';

import { FlatLookupPipe, NgxToolsSignalValidators } from '@myrmidon/ngx-tools';
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
import {
  copyFormValue,
  isImplicitSubmission,
  setFieldFromChild,
} from '@myrmidon/cadmus-ui';
import {
  renderLabelFromLastColon,
  ThesaurusTreeComponent,
} from '@myrmidon/cadmus-thesaurus-store';
import { Flag, FlagSetComponent } from '@myrmidon/cadmus-ui-flag-set';
import { LookupProviderOptions } from '@myrmidon/cadmus-refs-lookup';

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
 * The editable shape behind the instruction form.
 */
interface IcoInstructionControls {
  eid: string;
  types: TaggedString[];
  subject: string;
  script: string;
  text: string;
  // space-delimited
  sequences: string;
  repertoire: string;
  location: string;
  position: string;
  positionNote: string;
  targetLocation: string;
  implementation: string;
  differences: IcoInstructionDiff[];
  note: string;
  description: string;
  features: string[];
  languages: string[];
  tools: string[];
  colors: string[];
  colorReuses: IcoColorReuse[];
  links: AssertedCompositeId[];
  hasDate: boolean;
  date: HistoricalDateModel | null;
  assertion: Assertion | null;
}

/**
 * The editable shape behind the new type form.
 */
interface NewTypeControls {
  type: string;
  tag: string;
}

function toDraft(instruction?: IcoInstruction | null): IcoInstructionControls {
  return {
    eid: instruction?.eid || '',
    types: copyFormValue(instruction?.types || []),
    subject: instruction?.subject || '',
    script: instruction?.script || '',
    text: instruction?.text || '',
    sequences: instruction?.sequences?.join(' ') || '',
    repertoire: instruction?.repertoire || '',
    location: instruction?.location || '',
    position: instruction?.position || '',
    positionNote: instruction?.positionNote || '',
    targetLocation: instruction?.targetLocation || '',
    implementation: instruction?.implementation || '',
    differences: copyFormValue(instruction?.differences || []),
    note: instruction?.note || '',
    description: instruction?.description || '',
    features: [...(instruction?.features || [])],
    languages: [...(instruction?.languages || [])],
    tools: [...(instruction?.tools || [])],
    colors: [...(instruction?.colors || [])],
    colorReuses: copyFormValue(instruction?.colorReuses || []),
    links: copyFormValue(instruction?.links || []),
    hasDate: !!instruction?.date,
    date: copyFormValue(instruction?.date) || null,
    assertion: copyFormValue(instruction?.assertion) || null,
  };
}

function toInstruction(draft: IcoInstructionControls): IcoInstruction {
  // sequences are space-delimited: split on any whitespace run
  const sequences = draft.sequences.split(/\s+/).filter((s) => s.length);
  // arrays are copied, as the form tags their objects
  const items = <T>(array: T[]): T[] | undefined =>
    array.length ? copyFormValue(array) : undefined;

  return {
    eid: draft.eid.trim() || undefined,
    types: copyFormValue(draft.types),
    subject: draft.subject.trim() || undefined,
    script: draft.script.trim(),
    text: draft.text.trim() || undefined,
    sequences: sequences.length ? sequences : undefined,
    repertoire: draft.repertoire.trim() || undefined,
    location: draft.location.trim(),
    position: draft.position.trim(),
    positionNote: draft.positionNote.trim() || undefined,
    targetLocation: draft.targetLocation.trim() || undefined,
    implementation: draft.implementation.trim() || undefined,
    differences: items(draft.differences),
    note: draft.note.trim() || undefined,
    description: draft.description.trim() || undefined,
    features: items(draft.features),
    languages: items(draft.languages),
    tools: items(draft.tools),
    colors: items(draft.colors),
    colorReuses: items(draft.colorReuses),
    links: items(draft.links),
    date: draft.hasDate && draft.date ? copyFormValue(draft.date) : undefined,
    assertion: copyFormValue(draft.assertion) || undefined,
  };
}

@Component({
  selector: 'cadmus-ico-instructions-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormField,
    MatButtonModule,
    MatCheckboxModule,
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
    ThesaurusTreeComponent,
  ],
  templateUrl: './ico-instruction-editor.component.html',
  styleUrl: './ico-instruction-editor.component.css',
})
export class IcoInstructionEditorComponent {
  private readonly _dialogService = inject(DialogService);

  public readonly instruction = model<IcoInstruction | undefined>();

  public readonly cancelEdit = output();

  // ico-instruction-type-tags
  public readonly instrTypeTagEntries = input<ThesaurusEntry[] | undefined>();
  // ico-instruction-types
  public readonly instrTypeEntries = input<ThesaurusEntry[] | undefined>();
  // ico-instruction-subjects
  public readonly instrSubjectEntries = input<ThesaurusEntry[] | undefined>();
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
  // asserted-id-features
  public readonly idFeatureEntries = input<ThesaurusEntry[] | undefined>();

  public readonly lookupProviderOptions = input<
    LookupProviderOptions | undefined
  >();

  // flags mapped from thesaurus entries
  public languageFlags = computed<Flag[]>(
    () => this.instrLanguageEntries()?.map((e) => entryToFlag(e)) || [],
  );
  public featureFlags = computed<Flag[]>(
    () => this.instrFeatEntries()?.map((e) => entryToFlag(e)) || [],
  );
  public toolFlags = computed<Flag[]>(
    () => this.instrToolEntries()?.map((e) => entryToFlag(e)) || [],
  );
  public colorFlags = computed<Flag[]>(
    () => this.instrColorEntries()?.map((e) => entryToFlag(e)) || [],
  );

  public readonly editedDiff = signal<IcoInstructionDiff | undefined>(
    undefined,
  );
  public readonly editedDiffIndex = signal<number>(-1);

  public readonly editedReuse = signal<IcoColorReuse | undefined>(undefined);
  public readonly editedReuseIndex = signal<number>(-1);

  // new type form
  private readonly _newType = signal<NewTypeControls>({ type: '', tag: '' });
  public readonly typeForm = form(this._newType, (p) => {
    required(p.type);
    maxLength(p.type, 100);
    maxLength(p.tag, 100);
  });

  // the draft is rebuilt from a new instruction, but kept on the echo
  // of our save
  private readonly _draft = linkedSignal<
    IcoInstruction | undefined,
    IcoInstructionControls
  >({
    source: () => this.instruction(),
    computation: (instruction, previous) =>
      previous &&
      JSON.stringify(instruction) ===
        JSON.stringify(toInstruction(previous.value))
        ? previous.value
        : toDraft(instruction),
  });

  public readonly form = form(this._draft, (p) => {
    maxLength(p.eid, 100);
    NgxToolsSignalValidators.strictMinLength(p.types, 1);
    maxLength(p.subject, 500);
    required(p.script);
    maxLength(p.text, 5000);
    maxLength(p.repertoire, 100);
    maxLength(p.location, 100);
    required(p.position);
    maxLength(p.position, 100);
    maxLength(p.positionNote, 1000);
    maxLength(p.targetLocation, 100);
    maxLength(p.implementation, 5000);
    maxLength(p.note, 5000);
    maxLength(p.description, 5000);
  });

  constructor() {
    // clear the interaction state once the draft mirrors the bound instruction
    effect(() => {
      const draft = this._draft();
      untracked(() => {
        if (this.isDraftInSync(draft)) {
          this.form().reset();
        }
      });
    });
  }

  private isDraftInSync(draft: IcoInstructionControls): boolean {
    return (
      JSON.stringify(draft) === JSON.stringify(toDraft(this.instruction()))
    );
  }

  /**
   * Set the items of a list field, as the effect of a user action.
   */
  private setItems<T>(field: FieldTree<T[]>, items: T[]): void {
    field().value.set(items);
    field().markAsDirty();
  }

  //#region Types
  public addType(): void {
    if (this.typeForm().invalid()) {
      this.typeForm().markAsTouched();
      return;
    }
    const type = this._newType();
    this.setItems(this.form.types, [
      ...this.form.types().value(),
      {
        value: type.type.trim(),
        tag: type.tag.trim() || undefined,
      },
    ]);
    this._newType.set({ type: '', tag: '' });
    this.typeForm().reset();
  }

  /**
   * Enter in a new type input adds the type when it is valid, like the
   * add button; it never saves the instruction.
   */
  public onTypeEnterKey(event: Event): void {
    if (!isImplicitSubmission(event)) {
      return;
    }
    event.preventDefault();
    if (!this.typeForm().invalid()) {
      this.addType();
    }
  }

  public deleteType(index: number): void {
    this.setItems(
      this.form.types,
      this.form.types().value().filter((_, i) => i !== index),
    );
  }

  public moveTypeUp(index: number): void {
    if (index < 1) {
      return;
    }
    this.setItems(
      this.form.types,
      moveItem(this.form.types().value(), index, index - 1),
    );
  }

  public moveTypeDown(index: number): void {
    if (index + 1 >= this.form.types().value().length) {
      return;
    }
    this.setItems(
      this.form.types,
      moveItem(this.form.types().value(), index, index + 1),
    );
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
    this.editedDiff.set(copyFormValue(entry));
  }

  public closeDiff(): void {
    this.editedDiffIndex.set(-1);
    this.editedDiff.set(undefined);
  }

  public saveDiff(entry: IcoInstructionDiff): void {
    const differences = [...this.form.differences().value()];
    if (this.editedDiffIndex() === -1) {
      differences.push(entry);
    } else {
      differences.splice(this.editedDiffIndex(), 1, entry);
    }
    this.setItems(this.form.differences, differences);
    this.closeDiff();
  }

  public deleteDiff(index: number): void {
    this._dialogService
      .confirm('Confirmation', `Delete diff #${index + 1}?`)
      .subscribe((yes: boolean | undefined) => {
        if (yes) {
          if (this.editedDiffIndex() === index) {
            this.closeDiff();
          } else if (this.editedDiffIndex() > index) {
            // keep tracking the edited diff, which shifted up
            this.editedDiffIndex.update((i) => i - 1);
          }
          this.setItems(
            this.form.differences,
            this.form.differences().value().filter((_, i) => i !== index),
          );
        }
      });
  }

  public moveDiffUp(index: number): void {
    if (index < 1) {
      return;
    }
    this.editedDiffIndex.set(
      swapIndex(this.editedDiffIndex(), index, index - 1),
    );
    this.setItems(
      this.form.differences,
      moveItem(this.form.differences().value(), index, index - 1),
    );
  }

  public moveDiffDown(index: number): void {
    if (index + 1 >= this.form.differences().value().length) {
      return;
    }
    this.editedDiffIndex.set(
      swapIndex(this.editedDiffIndex(), index, index + 1),
    );
    this.setItems(
      this.form.differences,
      moveItem(this.form.differences().value(), index, index + 1),
    );
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
    this.editedReuse.set(copyFormValue(entry));
  }

  public closeColorReuse(): void {
    this.editedReuseIndex.set(-1);
    this.editedReuse.set(undefined);
  }

  public saveColorReuse(entry: IcoColorReuse): void {
    const entries = [...this.form.colorReuses().value()];
    if (this.editedReuseIndex() === -1) {
      entries.push(entry);
    } else {
      entries.splice(this.editedReuseIndex(), 1, entry);
    }
    this.setItems(this.form.colorReuses, entries);
    this.closeColorReuse();
  }

  public deleteColorReuse(index: number): void {
    this._dialogService
      .confirm('Confirmation', `Delete color reuse #${index + 1}?`)
      .subscribe((yes: boolean | undefined) => {
        if (yes) {
          if (this.editedReuseIndex() === index) {
            this.closeColorReuse();
          } else if (this.editedReuseIndex() > index) {
            // keep tracking the edited reuse, which shifted up
            this.editedReuseIndex.update((i) => i - 1);
          }
          this.setItems(
            this.form.colorReuses,
            this.form.colorReuses().value().filter((_, i) => i !== index),
          );
        }
      });
  }

  public moveColorReuseUp(index: number): void {
    if (index < 1) {
      return;
    }
    this.editedReuseIndex.set(
      swapIndex(this.editedReuseIndex(), index, index - 1),
    );
    this.setItems(
      this.form.colorReuses,
      moveItem(this.form.colorReuses().value(), index, index - 1),
    );
  }

  public moveColorReuseDown(index: number): void {
    if (index + 1 >= this.form.colorReuses().value().length) {
      return;
    }
    this.editedReuseIndex.set(
      swapIndex(this.editedReuseIndex(), index, index + 1),
    );
    this.setItems(
      this.form.colorReuses,
      moveItem(this.form.colorReuses().value(), index, index + 1),
    );
  }
  //#endregion

  public onLanguageCheckedIdsChange(ids: string[]): void {
    setFieldFromChild(this.form.languages, [...(ids || [])]);
  }

  public onFeatureCheckedIdsChange(ids: string[]): void {
    setFieldFromChild(this.form.features, [...(ids || [])]);
  }

  public onToolCheckedIdsChange(ids: string[]): void {
    setFieldFromChild(this.form.tools, [...(ids || [])]);
  }

  public onColorCheckedIdsChange(ids: string[]): void {
    setFieldFromChild(this.form.colors, [...(ids || [])]);
  }

  public onDateChange(date: HistoricalDateModel | undefined | null): void {
    setFieldFromChild(this.form.date, copyFormValue(date) || null);
  }

  public onLinksChange(ids: AssertedCompositeId[]): void {
    setFieldFromChild(this.form.links, copyFormValue(ids || []));
  }

  public onAssertionChange(assertion: Assertion | undefined | null): void {
    setFieldFromChild(this.form.assertion, copyFormValue(assertion) || null);
  }

  public renderLabel(label: string): string {
    return renderLabelFromLastColon(label);
  }

  public onEntryChange(entry: ThesaurusEntry): void {
    this.form.subject().value.set(entry.value);
    this.form.subject().markAsDirty();
  }

  /**
   * Enter in a text input saves the instruction, where the save button
   * would be enabled.
   */
  public onEnterKey(event: Event): void {
    // an input in a child's own form (e.g. the finder of the subjects
    // tree) belongs to that form, which handles its Enter
    if (
      !isImplicitSubmission(event) ||
      (event.target as HTMLInputElement).form
    ) {
      return;
    }
    event.preventDefault();
    if (!this.form().invalid() && this.form().dirty()) {
      this.save();
    }
  }

  public cancel(): void {
    this.cancelEdit.emit();
  }

  /**
   * Save the current draft into the `instruction` model signal.
   * @param pristine If true (default), the form's interaction state is
   * cleared after saving.
   */
  public save(pristine = true): void {
    if (this.form().invalid()) {
      // show validation errors
      this.form().markAsTouched();
      return;
    }

    this.instruction.set(toInstruction(this._draft()));

    if (pristine) {
      this.form().reset();
    }
  }
}
