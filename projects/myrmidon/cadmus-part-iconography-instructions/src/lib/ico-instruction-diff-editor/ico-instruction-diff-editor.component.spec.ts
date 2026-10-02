import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { ThesaurusEntry } from '@myrmidon/cadmus-core';

import { IcoInstructionDiff } from '../ico-instructions-part';
import { IcoInstructionDiffEditorComponent } from './ico-instruction-diff-editor.component';

const TYPE_ENTRIES: ThesaurusEntry[] = [
  { id: 'omission', value: 'omission' },
  { id: 'addition', value: 'addition' },
];

async function setup(
  diff?: IcoInstructionDiff,
  instrDiffTypeEntries?: ThesaurusEntry[],
) {
  const diffChange = vi.fn();
  const cancelEdit = vi.fn();
  const result = await render(IcoInstructionDiffEditorComponent, {
    inputs: { diff, instrDiffTypeEntries },
    on: { cancelEdit },
  });
  const component = result.fixture.componentInstance;
  component.diff.subscribe(diffChange);
  await result.fixture.whenStable();
  return { ...result, component, diffChange, cancelEdit };
}

function getSaveButton(): HTMLButtonElement {
  return screen.getByRole('button', { description: 'Accept changes' });
}

describe('IcoInstructionDiffEditorComponent', () => {
  it('should create with an empty form when no diff is set', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
    expect(component.type.value).toBe('');
    expect(component.target.value).toBeNull();
    expect(component.note.value).toBeNull();
    expect(component.form.invalid).toBe(true);
  });

  it('should fill the form from the diff model', async () => {
    const { component } = await setup({
      type: 'omission',
      target: 'tgt',
      note: 'a note',
    });
    expect(component.type.value).toBe('omission');
    expect(component.target.value).toBe('tgt');
    expect(component.note.value).toBe('a note');
    expect(component.form.pristine).toBe(true);
    expect(component.form.valid).toBe(true);
  });

  it('should reset the form when diff is reset to undefined', async () => {
    const { component, fixture } = await setup({ type: 'x', target: 't' });
    fixture.componentRef.setInput('diff', undefined);
    fixture.detectChanges();
    expect(component.type.value).toBe('');
    expect(component.target.value).toBeNull();
  });

  it('should render a free text input for type without thesaurus', async () => {
    await setup({ type: 'x' });
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(screen.getByLabelText('type')).toBeInstanceOf(HTMLInputElement);
  });

  it('should render a select for type with thesaurus', async () => {
    await setup({ type: 'addition' }, TYPE_ENTRIES);
    const select = screen.getByRole('combobox');
    expect(select.textContent).toContain('addition');
  });

  it('should pick type from thesaurus select', async () => {
    const user = userEvent.setup();
    const { component } = await setup({ type: 'addition' }, TYPE_ENTRIES);
    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByRole('option', { name: 'omission' }));
    expect(component.type.value).toBe('omission');
  });

  it('should disable save button when pristine', async () => {
    await setup({ type: 'x' });
    expect(getSaveButton().disabled).toBe(true);
  });

  it('should save edited data emitting trimmed values', async () => {
    const user = userEvent.setup();
    const { diffChange, fixture } = await setup({ type: 'x' });
    await user.clear(screen.getByLabelText('type'));
    await user.type(screen.getByLabelText('type'), '  y  ');
    await user.type(screen.getByLabelText('target'), '  tgt ');
    await user.type(screen.getByLabelText('note'), ' n ');
    fixture.detectChanges();
    expect(getSaveButton().disabled).toBe(false);
    await user.click(getSaveButton());
    expect(diffChange).toHaveBeenCalledTimes(1);
    expect(diffChange).toHaveBeenCalledWith({
      type: 'y',
      target: 'tgt',
      note: 'n',
    });
  });

  it('should save undefined for empty optional fields', async () => {
    const { component, diffChange } = await setup({
      type: 'x',
      target: 't',
      note: 'n',
    });
    component.target.setValue('   ');
    component.note.setValue('');
    component.save();
    expect(diffChange).toHaveBeenCalledWith({
      type: 'x',
      target: undefined,
      note: undefined,
    });
    expect(component.form.pristine).toBe(true);
  });

  it('should keep form dirty when saving with pristine=false', async () => {
    const { component, diffChange } = await setup({ type: 'x' });
    component.target.setValue('t');
    component.form.markAsDirty();
    component.save(false);
    expect(diffChange).toHaveBeenCalled();
    expect(component.form.dirty).toBe(true);
  });

  it('should not save when invalid and mark all as touched', async () => {
    const { component, diffChange } = await setup({ type: 'x' });
    component.type.setValue('');
    component.save();
    expect(diffChange).not.toHaveBeenCalled();
    expect(component.type.touched).toBe(true);
  });

  it('should show required error when type is cleared', async () => {
    const user = userEvent.setup();
    await setup({ type: 'x' });
    await user.clear(screen.getByLabelText('type'));
    await user.tab();
    expect(await screen.findByText('type required')).toBeTruthy();
  });

  it('should show too-long errors', async () => {
    const { component, fixture } = await setup({ type: 'x' });
    component.type.setValue('a'.repeat(101));
    component.target.setValue('a'.repeat(101));
    component.note.setValue('a'.repeat(1001));
    component.form.markAllAsTouched();
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    expect(screen.getByText('type too long')).toBeTruthy();
    expect(screen.getByText('target too long')).toBeTruthy();
    expect(screen.getByText('note too long')).toBeTruthy();
  });

  it('should emit cancelEdit on cancel button', async () => {
    const user = userEvent.setup();
    const { cancelEdit, diffChange } = await setup({ type: 'x' });
    await user.click(screen.getByRole('button', { description: 'Discard changes' }));
    expect(cancelEdit).toHaveBeenCalledTimes(1);
    expect(diffChange).not.toHaveBeenCalled();
  });
});
