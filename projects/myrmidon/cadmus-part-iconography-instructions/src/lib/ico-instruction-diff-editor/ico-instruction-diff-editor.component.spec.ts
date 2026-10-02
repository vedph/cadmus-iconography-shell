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
  const refresh = async () => {
    result.fixture.changeDetectorRef.markForCheck();
    result.fixture.detectChanges();
    await result.fixture.whenStable();
  };
  return { ...result, component, diffChange, cancelEdit, refresh };
}

function getSaveButton(): HTMLButtonElement {
  return screen.getByRole('button', { description: 'Accept changes' });
}

describe('IcoInstructionDiffEditorComponent', () => {
  it('should create with an empty form when no diff is set', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
    expect(component.form.type().value()).toBe('');
    expect(component.form.target().value()).toBe('');
    expect(component.form.note().value()).toBe('');
    expect(component.form().invalid()).toBe(true);
  });

  it('should fill the form from the diff model', async () => {
    const { component } = await setup({
      type: 'omission',
      target: 'tgt',
      note: 'a note',
    });
    expect(component.form.type().value()).toBe('omission');
    expect(component.form.target().value()).toBe('tgt');
    expect(component.form.note().value()).toBe('a note');
    expect(component.form().dirty()).toBe(false);
    expect(component.form().valid()).toBe(true);
  });

  it('should reset the form when diff is reset to undefined', async () => {
    const { component, fixture } = await setup({ type: 'x', target: 't' });
    fixture.componentRef.setInput('diff', undefined);
    fixture.detectChanges();
    expect(component.form.type().value()).toBe('');
    expect(component.form.target().value()).toBe('');
  });

  it('should rebuild the form and clear its state for a new diff', async () => {
    const user = userEvent.setup();
    const { component, fixture } = await setup({ type: 'x' });
    await user.type(screen.getByLabelText('target'), 't');
    expect(component.form().dirty()).toBe(true);
    fixture.componentRef.setInput('diff', { type: 'y' });
    await fixture.whenStable();
    expect(component.form.type().value()).toBe('y');
    expect(component.form.target().value()).toBe('');
    expect(component.form().dirty()).toBe(false);
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
    expect(component.form.type().value()).toBe('omission');
    expect(component.form().dirty()).toBe(true);
  });

  it('should disable save button when pristine', async () => {
    await setup({ type: 'x' });
    expect(getSaveButton().disabled).toBe(true);
  });

  it('should disable save button when invalid', async () => {
    const user = userEvent.setup();
    const { refresh } = await setup({ type: 'x' });
    await user.clear(screen.getByLabelText('type'));
    await refresh();
    expect(getSaveButton().disabled).toBe(true);
  });

  it('should save edited data emitting trimmed values', async () => {
    const user = userEvent.setup();
    const { component, diffChange, fixture } = await setup({ type: 'x' });
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
    expect(component.form().dirty()).toBe(false);
  });

  it('should keep the draft when its own save echoes back normalized', async () => {
    const user = userEvent.setup();
    const { component, fixture } = await setup({ type: 'x' });
    await user.type(screen.getByLabelText('target'), 'abc ');
    component.save();
    await fixture.whenStable();
    // the model got the trimmed value...
    expect(component.diff()?.target).toBe('abc');
    // ...but the draft still holds what the user typed
    expect(component.form.target().value()).toBe('abc ');
    await user.type(screen.getByLabelText('target'), 'd');
    expect(component.form.target().value()).toBe('abc d');
  });

  it('should save undefined for empty optional fields', async () => {
    const { component, diffChange } = await setup({
      type: 'x',
      target: 't',
      note: 'n',
    });
    component.form.target().value.set('   ');
    component.form.note().value.set('');
    component.save();
    expect(diffChange).toHaveBeenCalledWith({
      type: 'x',
      target: undefined,
      note: undefined,
    });
    expect(component.form().dirty()).toBe(false);
  });

  it('should keep form dirty when saving with pristine=false', async () => {
    const { component, diffChange } = await setup({ type: 'x' });
    component.form.target().value.set('t');
    component.form().markAsDirty();
    component.save(false);
    expect(diffChange).toHaveBeenCalled();
    expect(component.form().dirty()).toBe(true);
  });

  it('should not save when invalid and mark all as touched', async () => {
    const { component, diffChange } = await setup({ type: 'x' });
    component.form.type().value.set('');
    component.save();
    expect(diffChange).not.toHaveBeenCalled();
    expect(component.form.type().touched()).toBe(true);
  });

  it('should show required error when type is cleared', async () => {
    const user = userEvent.setup();
    await setup({ type: 'x' });
    await user.clear(screen.getByLabelText('type'));
    await user.tab();
    expect(await screen.findByText('type required')).toBeTruthy();
  });

  it('should show too-long errors', async () => {
    const { component, refresh } = await setup({ type: 'x' });
    component.form.type().value.set('a'.repeat(101));
    component.form.target().value.set('a'.repeat(101));
    component.form.note().value.set('a'.repeat(1001));
    component.form().markAsTouched();
    await refresh();
    expect(screen.getByText('type too long')).toBeTruthy();
    expect(screen.getByText('target too long')).toBeTruthy();
    expect(screen.getByText('note too long')).toBeTruthy();
  });

  it('should save on Enter in a text input when changed', async () => {
    const user = userEvent.setup();
    const { diffChange } = await setup({ type: 'x' });
    await user.type(screen.getByLabelText('target'), 't{Enter}');
    expect(diffChange).toHaveBeenCalledWith({
      type: 'x',
      target: 't',
      note: undefined,
    });
  });

  it('should not save on Enter when pristine or invalid', async () => {
    const user = userEvent.setup();
    const { diffChange } = await setup({ type: 'x' });
    await user.type(screen.getByLabelText('target'), '{Enter}');
    await user.clear(screen.getByLabelText('type'));
    await user.type(screen.getByLabelText('type'), '{Enter}');
    expect(diffChange).not.toHaveBeenCalled();
  });

  it('should emit cancelEdit on cancel button', async () => {
    const user = userEvent.setup();
    const { cancelEdit, diffChange } = await setup({ type: 'x' });
    await user.click(
      screen.getByRole('button', { description: 'Discard changes' }),
    );
    expect(cancelEdit).toHaveBeenCalledTimes(1);
    expect(diffChange).not.toHaveBeenCalled();
  });

  it('should render no form element', async () => {
    const { container } = await setup({ type: 'x' });
    expect(container.querySelector('form')).toBeNull();
  });
});
