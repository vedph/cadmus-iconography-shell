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

// cadmus
import { ThesaurusEntry } from '@myrmidon/cadmus-core';

import { IcoColorReuse } from '../ico-instructions-part';

@Component({
  selector: 'cadmus-ico-color-reuse-editor',
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
  templateUrl: './ico-color-reuse-editor.component.html',
  styleUrl: './ico-color-reuse-editor.component.css',
})
export class IcoColorReuseEditorComponent {
  public readonly reuse = model<IcoColorReuse | undefined>();
  public readonly cancelEdit = output();

  // ico-instruction-colors
  public readonly colorEntries = input<ThesaurusEntry[] | undefined>(undefined);

  public color: FormControl<string>;
  public location: FormControl<string>;
  public note: FormControl<string | null>;
  public form: FormGroup;

  constructor(formBuilder: FormBuilder) {
    // form
    this.color = formBuilder.control('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    });
    this.location = formBuilder.control('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    });
    this.note = formBuilder.control(null, {
      validators: [Validators.maxLength(1000)],
    });
    this.form = formBuilder.group({
      color: this.color,
      location: this.location,
      note: this.note,
    });

    // when model changes, update form
    effect(() => {
      const reuse = this.reuse();
      this.updateForm(reuse);
    });
  }

  private updateForm(data: IcoColorReuse | undefined | null): void {
    if (!data) {
      this.form.reset();
    } else {
      this.color.setValue(data.color || '');
      this.location.setValue(data.location || '');
      this.note.setValue(data.note || null);
      this.form.markAsPristine();
    }
  }

  private getReuse(): IcoColorReuse {
    return {
      color: this.color.value?.trim() || '',
      location: this.location.value?.trim() || '',
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

    const reuse = this.getReuse();
    this.reuse.set(reuse);

    if (pristine) {
      this.form.markAsPristine();
    }
  }
}
