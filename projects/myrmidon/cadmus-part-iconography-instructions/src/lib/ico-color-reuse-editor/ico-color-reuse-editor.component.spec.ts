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
  const refresh = async () => {
    result.fixture.changeDetectorRef.markForCheck();
    result.fixture.detectChanges();
    await result.fixture.whenStable();
  };
  return { ...result, component, reuseChange, cancelEdit, refresh };
}

function getSaveButton(): HTMLButtonElement {
  return screen.getByRole('button', { description: 'Accept changes' });
}

describe('IcoColorReuseEditorComponent', () => {
  it('should create with an empty invalid form when no reuse is set', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
    expect(component.form.color().value()).toBe('');
    expect(component.form.location().value()).toBe('');
    expect(component.form.note().value()).toBe('');
    expect(component.form().invalid()).toBe(true);
  });

  it('should fill the form from the reuse model', async () => {
    const { component } = await setup({
      color: 'red',
      location: '12r',
      note: 'n',
    });
    expect(component.form.color().value()).toBe('red');
    expect(component.form.location().value()).toBe('12r');
    expect(component.form.note().value()).toBe('n');
    expect(component.form().valid()).toBe(true);
    expect(component.form().dirty()).toBe(false);
  });

  it('should reset the form when reuse is reset to undefined', async () => {
    const { component, fixture } = await setup({ color: 'x', location: 'y' });
    fixture.componentRef.setInput('reuse', undefined);
    fixture.detectChanges();
    expect(component.form.color().value()).toBe('');
    expect(component.form.location().value()).toBe('');
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
    expect(component.form.color().value()).toBe('blue');
    expect(component.form.color().dirty()).toBe(true);
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

  it('should keep the draft when its own save echoes back normalized', async () => {
    const user = userEvent.setup();
    const { component, fixture } = await setup({ color: 'x', location: 'y' });
    await user.type(screen.getByLabelText('note'), 'abc ');
    component.save();
    await fixture.whenStable();
    expect(component.reuse()?.note).toBe('abc');
    expect(component.form.note().value()).toBe('abc ');
    await user.type(screen.getByLabelText('note'), 'd');
    expect(component.form.note().value()).toBe('abc d');
  });

  it('should save undefined note when empty', async () => {
    const { component, reuseChange } = await setup({
      color: 'x',
      location: 'y',
      note: 'n',
    });
    component.form.note().value.set('  ');
    component.save();
    expect(reuseChange).toHaveBeenCalledWith({
      color: 'x',
      location: 'y',
      note: undefined,
    });
    expect(component.form().dirty()).toBe(false);
  });

  it('should keep form dirty when saving with pristine=false', async () => {
    const { component, reuseChange } = await setup({
      color: 'x',
      location: 'y',
    });
    component.form.note().value.set('n');
    component.form().markAsDirty();
    component.save(false);
    expect(reuseChange).toHaveBeenCalled();
    expect(component.form().dirty()).toBe(true);
  });

  it('should not save when invalid', async () => {
    const { component, reuseChange } = await setup({
      color: 'x',
      location: 'y',
    });
    component.form.location().value.set('');
    component.save();
    expect(reuseChange).not.toHaveBeenCalled();
    expect(component.form.location().touched()).toBe(true);
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
    const { component, refresh } = await setup({ color: 'x', location: 'y' });
    component.form.color().value.set('a'.repeat(101));
    component.form.location().value.set('a'.repeat(101));
    component.form.note().value.set('a'.repeat(1001));
    component.form().markAsTouched();
    await refresh();
    expect(screen.getByText('color too long')).toBeTruthy();
    expect(screen.getByText('location too long')).toBeTruthy();
    expect(screen.getByText('note too long')).toBeTruthy();
  });

  it('should save on Enter in a text input when changed', async () => {
    const user = userEvent.setup();
    const { reuseChange } = await setup({ color: 'x', location: 'y' });
    await user.type(screen.getByLabelText('location'), 'z{Enter}');
    expect(reuseChange).toHaveBeenCalledWith({
      color: 'x',
      location: 'yz',
      note: undefined,
    });
  });

  it('should not save on Enter when pristine or invalid', async () => {
    const user = userEvent.setup();
    const { reuseChange } = await setup({ color: 'x', location: 'y' });
    await user.type(screen.getByLabelText('location'), '{Enter}');
    await user.clear(screen.getByLabelText('color'));
    await user.type(screen.getByLabelText('color'), '{Enter}');
    expect(reuseChange).not.toHaveBeenCalled();
  });

  it('should emit cancelEdit on cancel button', async () => {
    const user = userEvent.setup();
    const { cancelEdit, reuseChange } = await setup({
      color: 'x',
      location: 'y',
    });
    await user.click(
      screen.getByRole('button', { description: 'Discard changes' }),
    );
    expect(cancelEdit).toHaveBeenCalledTimes(1);
    expect(reuseChange).not.toHaveBeenCalled();
  });

  it('should render no form element', async () => {
    const { container } = await setup({ color: 'x', location: 'y' });
    expect(container.querySelector('form')).toBeNull();
  });
});
