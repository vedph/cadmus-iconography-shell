import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  linkedSignal,
  model,
  output,
  untracked,
} from '@angular/core';
import { form, FormField, maxLength, required } from '@angular/forms/signals';

// material
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ThesaurusEntry } from '@myrmidon/cadmus-core';
import { isImplicitSubmission } from '@myrmidon/cadmus-ui';

import { IcoInstructionDiff } from '../ico-instructions-part';

/**
 * The editable shape behind the diff form.
 */
interface IcoInstructionDiffControls {
  type: string;
  target: string;
  note: string;
}

function toDraft(diff?: IcoInstructionDiff | null): IcoInstructionDiffControls {
  return {
    type: diff?.type || '',
    target: diff?.target || '',
    note: diff?.note || '',
  };
}

function toDiff(draft: IcoInstructionDiffControls): IcoInstructionDiff {
  return {
    type: draft.type.trim(),
    target: draft.target.trim() || undefined,
    note: draft.note.trim() || undefined,
  };
}

@Component({
  selector: 'cadmus-ico-instruction-diff-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormField,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
  ],
  templateUrl: './ico-instruction-diff-editor.component.html',
  styleUrl: './ico-instruction-diff-editor.component.css',
})
export class IcoInstructionDiffEditorComponent {
  public readonly diff = model<IcoInstructionDiff | undefined>();
  public readonly cancelEdit = output();

  // ico-instruction-diff-types
  public readonly instrDiffTypeEntries = input<ThesaurusEntry[] | undefined>();

  // the draft is rebuilt from a new diff, but kept on the echo of our save
  private readonly _draft = linkedSignal<
    IcoInstructionDiff | undefined,
    IcoInstructionDiffControls
  >({
    source: () => this.diff(),
    computation: (diff, previous) =>
      previous &&
      JSON.stringify(diff) === JSON.stringify(toDiff(previous.value))
        ? previous.value
        : toDraft(diff),
  });

  public readonly form = form(this._draft, (p) => {
    required(p.type);
    maxLength(p.type, 100);
    maxLength(p.target, 100);
    maxLength(p.note, 1000);
  });

  constructor() {
    // clear the interaction state once the draft mirrors the bound diff
    effect(() => {
      const draft = this._draft();
      untracked(() => {
        if (this.isDraftInSync(draft)) {
          this.form().reset();
        }
      });
    });
  }

  private isDraftInSync(draft: IcoInstructionDiffControls): boolean {
    return JSON.stringify(draft) === JSON.stringify(toDraft(this.diff()));
  }

  public onEnterKey(event: Event): void {
    if (!isImplicitSubmission(event)) {
      return;
    }
    event.preventDefault();
    // like the disabled save button
    if (!this.form().invalid() && this.form().dirty()) {
      this.save();
    }
  }

  public cancel(): void {
    this.cancelEdit.emit();
  }

  /**
   * Save the current draft into the `diff` model signal.
   * @param pristine If true (default), the form's interaction state is
   * cleared after saving.
   */
  public save(pristine = true): void {
    if (this.form().invalid()) {
      // show validation errors
      this.form().markAsTouched();
      return;
    }

    this.diff.set(toDiff(this._draft()));

    if (pristine) {
      this.form().reset();
    }
  }
}
