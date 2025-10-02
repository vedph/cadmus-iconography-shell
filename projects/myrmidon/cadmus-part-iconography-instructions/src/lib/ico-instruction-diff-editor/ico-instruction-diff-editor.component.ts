import { CommonModule } from '@angular/common';
import { Component, effect, input, model, output } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

// material
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

import { IcoInstructionDiff } from '../ico-instructions-part';
import { ThesaurusEntry } from '@myrmidon/cadmus-core';

@Component({
  selector: 'cadmus-ico-instruction-diff-editor',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
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

  public type: FormControl<string>;
  public target: FormControl<string | null>;
  public note: FormControl<string | null>;
  public form: FormGroup;

  constructor(formBuilder: FormBuilder) {
    // form
    this.type = formBuilder.control('text', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    });
    this.target = formBuilder.control(null, Validators.maxLength(100));
    this.note = formBuilder.control(null, Validators.maxLength(1000));
    this.form = formBuilder.group({
      type: this.type,
      target: this.target,
      note: this.note,
    });

    // when model changes, update form
    effect(() => {
      const diff = this.diff();
      this.updateForm(diff);
    });
  }

  private updateForm(data: IcoInstructionDiff | undefined | null): void {
    if (!data) {
      this.form.reset();
    } else {
      this.type.setValue(data.type || 'text');
      this.target.setValue(data.target || null);
      this.note.setValue(data.note || null);
      this.form.markAsPristine();
    }
  }

  private getDiff(): IcoInstructionDiff {
    return {
      type: this.type.value,
      target: this.target.value?.trim() || undefined,
      note: this.note.value?.trim() || undefined,
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

    const data = this.getDiff();
    this.diff.set(data);

    if (pristine) {
      this.form.markAsPristine();
    }
  }
}
