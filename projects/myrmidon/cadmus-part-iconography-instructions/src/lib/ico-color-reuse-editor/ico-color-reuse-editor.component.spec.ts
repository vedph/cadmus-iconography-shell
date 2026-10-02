import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { ThesaurusEntry } from '@myrmidon/cadmus-core';

import { IcoColorReuse } from '../ico-instructions-part';
import { IcoColorReuseEditorComponent } from './ico-color-reuse-editor.component';

const COLOR_ENTRIES: ThesaurusEntry[] = [
  { id: 'red', value: 'red' },
  { id: 'blue', value: 'blue' },
];

async function setup(reuse?: IcoColorReuse, colorEntries?: ThesaurusEntry[]) {
  const reuseChange = vi.fn();
  const cancelEdit = vi.fn();
  const result = await render(IcoColorReuseEditorComponent, {
    inputs: { reuse, colorEntries },
    on: { cancelEdit },
  });
  const component = result.fixture.componentInstance;
  component.reuse.subscribe(reuseChange);
  await result.fixture.whenStable();
  return { ...result, component, reuseChange, cancelEdit };
}

function getSaveButton(): HTMLButtonElement {
  return screen.getByRole('button', { description: 'Accept changes' });
}

describe('IcoColorReuseEditorComponent', () => {
  it('should create with an empty invalid form when no reuse is set', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
    expect(component.color.value).toBe('');
    expect(component.location.value).toBe('');
    expect(component.note.value).toBeNull();
    expect(component.form.invalid).toBe(true);
  });

  it('should fill the form from the reuse model', async () => {
    const { component } = await setup({
      color: 'red',
      location: '12r',
      note: 'n',
    });
    expect(component.color.value).toBe('red');
    expect(component.location.value).toBe('12r');
    expect(component.note.value).toBe('n');
    expect(component.form.valid).toBe(true);
    expect(component.form.pristine).toBe(true);
  });

  it('should reset the form when reuse is reset to undefined', async () => {
    const { component, fixture } = await setup({ color: 'x', location: 'y' });
    fixture.componentRef.setInput('reuse', undefined);
    fixture.detectChanges();
    expect(component.color.value).toBe('');
    expect(component.location.value).toBe('');
  });

  it('should render a free input for color without thesaurus', async () => {
    await setup({ color: 'x', location: 'y' });
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(screen.getByLabelText('color')).toBeInstanceOf(HTMLInputElement);
  });

  it('should pick color from thesaurus select', async () => {
    const user = userEvent.setup();
    const { component } = await setup(
      { color: 'red', location: 'y' },
      COLOR_ENTRIES,
    );
    const select = screen.getByRole('combobox');
    expect(select.textContent).toContain('red');
    await user.click(select);
    await user.click(await screen.findByRole('option', { name: 'blue' }));
    expect(component.color.value).toBe('blue');
    expect(component.color.dirty).toBe(true);
  });

  it('should disable save button when pristine', async () => {
    await setup({ color: 'x', location: 'y' });
    expect(getSaveButton().disabled).toBe(true);
  });

  it('should save edited data emitting trimmed values', async () => {
    const user = userEvent.setup();
    const { reuseChange } = await setup({ color: 'x', location: 'y' });
    await user.clear(screen.getByLabelText('color'));
    await user.type(screen.getByLabelText('color'), ' green ');
    await user.clear(screen.getByLabelText('location'));
    await user.type(screen.getByLabelText('location'), ' 3v ');
    await user.type(screen.getByLabelText('note'), ' note ');
    expect(getSaveButton().disabled).toBe(false);
    await user.click(getSaveButton());
    expect(reuseChange).toHaveBeenCalledTimes(1);
    expect(reuseChange).toHaveBeenCalledWith({
      color: 'green',
      location: '3v',
      note: 'note',
    });
  });

  it('should save undefined note when empty', async () => {
    const { component, reuseChange } = await setup({
      color: 'x',
      location: 'y',
      note: 'n',
    });
    component.note.setValue('  ');
    component.save();
    expect(reuseChange).toHaveBeenCalledWith({
      color: 'x',
      location: 'y',
      note: undefined,
    });
    expect(component.form.pristine).toBe(true);
  });

  it('should keep form dirty when saving with pristine=false', async () => {
    const { component, reuseChange } = await setup({ color: 'x', location: 'y' });
    component.note.setValue('n');
    component.form.markAsDirty();
    component.save(false);
    expect(reuseChange).toHaveBeenCalled();
    expect(component.form.dirty).toBe(true);
  });

  it('should not save when invalid', async () => {
    const { component, reuseChange } = await setup({ color: 'x', location: 'y' });
    component.location.setValue('');
    component.save();
    expect(reuseChange).not.toHaveBeenCalled();
    expect(component.location.touched).toBe(true);
  });

  it('should show required errors', async () => {
    const user = userEvent.setup();
    await setup({ color: 'x', location: 'y' });
    await user.clear(screen.getByLabelText('color'));
    await user.clear(screen.getByLabelText('location'));
    await user.tab();
    expect(await screen.findByText('color required')).toBeTruthy();
    expect(await screen.findByText('location required')).toBeTruthy();
  });

  it('should show too-long errors', async () => {
    const { component, fixture } = await setup({ color: 'x', location: 'y' });
    component.color.setValue('a'.repeat(101));
    component.location.setValue('a'.repeat(101));
    component.note.setValue('a'.repeat(1001));
    component.form.markAllAsTouched();
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    expect(screen.getByText('color too long')).toBeTruthy();
    expect(screen.getByText('location too long')).toBeTruthy();
    expect(screen.getByText('note too long')).toBeTruthy();
  });

  it('should emit cancelEdit on cancel button', async () => {
    const user = userEvent.setup();
    const { cancelEdit, reuseChange } = await setup({ color: 'x', location: 'y' });
    await user.click(screen.getByRole('button', { description: 'Discard changes' }));
    expect(cancelEdit).toHaveBeenCalledTimes(1);
    expect(reuseChange).not.toHaveBeenCalled();
  });
});
