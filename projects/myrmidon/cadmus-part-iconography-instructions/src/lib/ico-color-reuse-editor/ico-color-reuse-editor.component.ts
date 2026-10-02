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

// cadmus
import { ThesaurusEntry } from '@myrmidon/cadmus-core';
import { isImplicitSubmission } from '@myrmidon/cadmus-ui';

import { IcoColorReuse } from '../ico-instructions-part';

/**
 * The editable shape behind the color reuse form.
 */
interface IcoColorReuseControls {
  color: string;
  location: string;
  note: string;
}

function toDraft(reuse?: IcoColorReuse | null): IcoColorReuseControls {
  return {
    color: reuse?.color || '',
    location: reuse?.location || '',
    note: reuse?.note || '',
  };
}

function toReuse(draft: IcoColorReuseControls): IcoColorReuse {
  return {
    color: draft.color.trim(),
    location: draft.location.trim(),
    note: draft.note.trim() || undefined,
  };
}

@Component({
  selector: 'cadmus-ico-color-reuse-editor',
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
  templateUrl: './ico-color-reuse-editor.component.html',
  styleUrl: './ico-color-reuse-editor.component.css',
})
export class IcoColorReuseEditorComponent {
  public readonly reuse = model<IcoColorReuse | undefined>();
  public readonly cancelEdit = output();

  // ico-instruction-colors
  public readonly colorEntries = input<ThesaurusEntry[] | undefined>(undefined);

  // the draft is rebuilt from a new reuse, but kept on the echo of our save
  private readonly _draft = linkedSignal<
    IcoColorReuse | undefined,
    IcoColorReuseControls
  >({
    source: () => this.reuse(),
    computation: (reuse, previous) =>
      previous &&
      JSON.stringify(reuse) === JSON.stringify(toReuse(previous.value))
        ? previous.value
        : toDraft(reuse),
  });

  public readonly form = form(this._draft, (p) => {
    required(p.color);
    maxLength(p.color, 100);
    required(p.location);
    maxLength(p.location, 100);
    maxLength(p.note, 1000);
  });

  constructor() {
    // clear the interaction state once the draft mirrors the bound reuse
    effect(() => {
      const draft = this._draft();
      untracked(() => {
        if (this.isDraftInSync(draft)) {
          this.form().reset();
        }
      });
    });
  }

  private isDraftInSync(draft: IcoColorReuseControls): boolean {
    return JSON.stringify(draft) === JSON.stringify(toDraft(this.reuse()));
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
   * Save the current draft into the `reuse` model signal.
   * @param pristine If true (default), the form's interaction state is
   * cleared after saving.
   */
  public save(pristine = true): void {
    if (this.form().invalid()) {
      // show validation errors
      this.form().markAsTouched();
      return;
    }

    this.reuse.set(toReuse(this._draft()));

    if (pristine) {
      this.form().reset();
    }
  }
}
