import { Component, input, output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { render, screen, waitFor, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { of } from 'rxjs';

import { ThesaurusEntry } from '@myrmidon/cadmus-core';
import { FlatLookupPipe } from '@myrmidon/ngx-tools';
import { DialogService } from '@myrmidon/ngx-mat-tools';
import { Assertion } from '@myrmidon/cadmus-refs-assertion';
import { AssertedCompositeId } from '@myrmidon/cadmus-refs-asserted-ids';
import { HistoricalDateModel } from '@myrmidon/cadmus-refs-historical-date';
import { Flag } from '@myrmidon/cadmus-ui-flag-set';
import { LookupProviderOptions } from '@myrmidon/cadmus-refs-lookup';

import { IcoInstruction } from '../ico-instructions-part';
import { IcoInstructionDiffEditorComponent } from '../ico-instruction-diff-editor/ico-instruction-diff-editor.component';
import { IcoColorReuseEditorComponent } from '../ico-color-reuse-editor/ico-color-reuse-editor.component';
import { IcoInstructionEditorComponent } from './ico-instruction-editor.component';

//#region Stubs for third-party child components
// These mirror the selectors, inputs and outputs of the real components,
// so that template bindings are verified while keeping tests isolated.
@Component({ selector: 'cadmus-refs-asserted-composite-ids', template: '' })
class AssertedCompositeIdsStubComponent {
  public readonly ids = input<AssertedCompositeId[]>();
  public readonly idScopeEntries = input<ThesaurusEntry[]>();
  public readonly idTagEntries = input<ThesaurusEntry[]>();
  public readonly assTagEntries = input<ThesaurusEntry[]>();
  public readonly refTypeEntries = input<ThesaurusEntry[]>();
  public readonly refTagEntries = input<ThesaurusEntry[]>();
  public readonly featureEntries = input<ThesaurusEntry[]>();
  public readonly canSwitchMode = input<boolean>();
  public readonly canEditTarget = input<boolean>();
  public readonly lookupProviderOptions = input<LookupProviderOptions>();
  public readonly idsChange = output<AssertedCompositeId[]>();
}

@Component({ selector: 'cadmus-refs-assertion', template: '' })
class AssertionStubComponent {
  public readonly assTagEntries = input<ThesaurusEntry[]>();
  public readonly refTypeEntries = input<ThesaurusEntry[]>();
  public readonly refTagEntries = input<ThesaurusEntry[]>();
  public readonly assertion = input<Assertion>();
  public readonly assertionChange = output<Assertion | undefined>();
}

@Component({ selector: 'cadmus-refs-historical-date', template: '' })
class HistoricalDateStubComponent {
  public readonly date = input<HistoricalDateModel>();
  public readonly dateChange = output<HistoricalDateModel | undefined>();
}

@Component({ selector: 'cadmus-thesaurus-tree', template: '' })
class ThesaurusTreeStubComponent {
  public readonly entries = input<ThesaurusEntry[]>();
  public readonly renderLabel = input<(label: string) => string>();
  public readonly entryChange = output<ThesaurusEntry>();
}

@Component({ selector: 'cadmus-ui-flag-set', template: '' })
class FlagSetStubComponent {
  public readonly flags = input<Flag[]>();
  public readonly checkedIds = input<string[]>();
  public readonly checkedIdsChange = output<string[]>();
}
//#endregion

function entries(...ids: string[]): ThesaurusEntry[] {
  return ids.map((id) => ({ id, value: id.toUpperCase() }));
}

function minInstruction(): IcoInstruction {
  return {
    types: [{ value: 't1' }],
    script: 'latin',
    location: '1r',
    position: 'top',
  };
}

function fullInstruction(): IcoInstruction {
  return {
    eid: 'i1',
    types: [{ value: 't1', tag: 'tag1' }, { value: 't2' }],
    subject: 'subj',
    script: 'latin',
    text: 'text',
    sequences: ['a', 'b'],
    repertoire: 'rep',
    location: '1r',
    position: 'top',
    positionNote: 'pnote',
    targetLocation: '2v',
    implementation: 'impl',
    differences: [{ type: 'd1', target: 'x' }],
    note: 'note',
    description: 'descr',
    features: ['f1'],
    languages: ['lat'],
    tools: ['pen'],
    colors: ['red'],
    colorReuses: [{ color: 'red', location: '3r' }],
    links: [
      {
        target: { gid: 'g', label: 'l' },
      },
    ],
    date: { a: { value: 1200 } },
    assertion: { rank: 1 },
  };
}

interface SetupOptions {
  instruction?: IcoInstruction;
  inputs?: Record<string, unknown>;
  confirm?: boolean;
}

async function setup(options: SetupOptions = {}) {
  const instructionChange = vi.fn();
  const cancelEdit = vi.fn();
  const dialogService = {
    confirm: vi.fn().mockReturnValue(of(options.confirm ?? true)),
  };
  const result = await render(IcoInstructionEditorComponent, {
    inputs: { instruction: options.instruction, ...(options.inputs || {}) },
    on: { cancelEdit },
    providers: [{ provide: DialogService, useValue: dialogService }],
    componentImports: [
      ReactiveFormsModule,
      MatButtonModule,
      MatCheckboxModule,
      MatExpansionModule,
      MatFormFieldModule,
      MatIconModule,
      MatInputModule,
      MatSelectModule,
      MatTabsModule,
      MatTooltipModule,
      FlatLookupPipe,
      IcoInstructionDiffEditorComponent,
      IcoColorReuseEditorComponent,
      AssertedCompositeIdsStubComponent,
      AssertionStubComponent,
      FlagSetStubComponent,
      HistoricalDateStubComponent,
      ThesaurusTreeStubComponent,
    ],
  });
  const component = result.fixture.componentInstance;
  component.instruction.subscribe(instructionChange);
  await result.fixture.whenStable();

  const refresh = async () => {
    result.fixture.changeDetectorRef.markForCheck();
    result.fixture.detectChanges();
    await result.fixture.whenStable();
  };
  return {
    ...result,
    component,
    instructionChange,
    cancelEdit,
    dialogService,
    refresh,
  };
}

async function openTab(label: string, waitForSelector?: string) {
  const user = userEvent.setup();
  await user.click(screen.getByRole('tab', { name: label }));
  // tab content is lazily rendered
  if (waitForSelector) {
    await waitFor(() =>
      expect(document.querySelector(waitForSelector)).toBeTruthy(),
    );
  }
}

function stub<T>(
  fixture: { debugElement: { query: Function } },
  selector: string,
): T {
  const de = fixture.debugElement.query(
    (e: { nativeElement: Element }) =>
      e.nativeElement?.tagName?.toLowerCase() === selector,
  );
  return de?.componentInstance as T;
}

describe('IcoInstructionEditorComponent', () => {
  //#region Form binding
  it('should create with an empty invalid form', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
    expect(component.types.value).toEqual([]);
    expect(component.form.invalid).toBe(true);
    expect(component.typesList()).toEqual([]);
  });

  it('should fill the form from a full instruction', async () => {
    const { component } = await setup({ instruction: fullInstruction() });
    const i = fullInstruction();
    expect(component.eid.value).toBe(i.eid);
    expect(component.types.value).toEqual(i.types);
    expect(component.subject.value).toBe(i.subject);
    expect(component.script.value).toBe(i.script);
    expect(component.text.value).toBe(i.text);
    expect(component.sequences.value).toBe('a b');
    expect(component.repertoire.value).toBe(i.repertoire);
    expect(component.location.value).toBe(i.location);
    expect(component.position.value).toBe(i.position);
    expect(component.positionNote.value).toBe(i.positionNote);
    expect(component.targetLocation.value).toBe(i.targetLocation);
    expect(component.implementation.value).toBe(i.implementation);
    expect(component.differences.value).toEqual(i.differences);
    expect(component.note.value).toBe(i.note);
    expect(component.description.value).toBe(i.description);
    expect(component.features.value).toEqual(i.features);
    expect(component.languages.value).toEqual(i.languages);
    expect(component.tools.value).toEqual(i.tools);
    expect(component.colors.value).toEqual(i.colors);
    expect(component.colorReuses.value).toEqual(i.colorReuses);
    expect(component.links.value).toEqual(i.links);
    expect(component.hasDate.value).toBe(true);
    expect(component.date.value).toEqual(i.date);
    expect(component.assertion.value).toEqual(i.assertion);
    expect(component.form.valid).toBe(true);
    expect(component.form.pristine).toBe(true);
    // signal views
    expect(component.typesList()).toEqual(i.types);
    expect(component.differencesList()).toEqual(i.differences);
    expect(component.colorReusesList()).toEqual(i.colorReuses);
    expect(component.hasDateValue()).toBe(true);
  });

  it('should fill the form with defaults from a minimal instruction', async () => {
    const { component } = await setup({ instruction: minInstruction() });
    expect(component.eid.value).toBeNull();
    expect(component.sequences.value).toBeNull();
    expect(component.differences.value).toEqual([]);
    expect(component.features.value).toEqual([]);
    expect(component.links.value).toEqual([]);
    expect(component.hasDate.value).toBe(false);
    expect(component.date.value).toBeNull();
    expect(component.assertion.value).toBeNull();
  });

  it('should reset the form when instruction is reset', async () => {
    const { component, fixture } = await setup({
      instruction: fullInstruction(),
    });
    fixture.componentRef.setInput('instruction', undefined);
    fixture.detectChanges();
    expect(component.eid.value).toBeNull();
    expect(component.types.value).toEqual([]);
    expect(component.typesList()).toEqual([]);
    expect(component.hasDate.value).toBe(false);
  });

  it('should show EID too long error', async () => {
    const { component, refresh } = await setup({
      instruction: minInstruction(),
    });
    component.eid.setValue('x'.repeat(101));
    component.eid.markAsTouched();
    await refresh();
    expect(screen.getByText('EID too long')).toBeTruthy();
  });
  //#endregion

  it('should not re-create all list rows when instruction is reset (NG0956)', async () => {
    const warn = vi.spyOn(console, 'warn');
    const instruction = fullInstruction();
    instruction.differences = [{ type: 'd1' }, { type: 'd2' }];
    instruction.colorReuses = [
      { color: 'red', location: '1' },
      { color: 'blue', location: '2' },
    ];
    const { fixture } = await setup({ instruction });
    const reset = async () => {
      fixture.componentRef.setInput('instruction', structuredClone(instruction));
      fixture.detectChanges();
      await fixture.whenStable();
    };
    const ng0956 = () =>
      warn.mock.calls.filter((c) => String(c[0]).includes('NG0956'));

    // types (general tab)
    await reset();
    expect(ng0956()).toEqual([]);
    // diffs
    await openTab('Implementation');
    await screen.findByText('d2');
    await reset();
    expect(ng0956()).toEqual([]);
    // color reuses
    await openTab('Description');
    await screen.findByText('blue');
    await reset();
    expect(ng0956()).toEqual([]);
    warn.mockRestore();
  });

  it('should update a list row in place when its entry is replaced', async () => {
    const instruction = fullInstruction();
    instruction.differences = [{ type: 'd1', target: 'x' }, { type: 'd2' }];
    const { component } = await setup({ instruction });
    await openTab('Implementation');
    await screen.findByText('d2');
    component.editDiff(component.differences.value[0], 0);
    component.saveDiff({ type: 'dz', target: 'y' });
    expect(await screen.findByText('dz')).toBeTruthy();
    expect(screen.getByText('y')).toBeTruthy();
    expect(screen.queryByText('d1')).toBeNull();
    expect(screen.queryByText('x')).toBeNull();
  });
  //#endregion

  //#region Types
  it('should list types with looked-up labels', async () => {
    await setup({
      instruction: fullInstruction(),
      inputs: {
        instrTypeEntries: entries('t1', 't2'),
        instrTypeTagEntries: entries('tag1'),
      },
    });
    expect(screen.getByText('T1')).toBeTruthy();
    expect(screen.getByText('T2')).toBeTruthy();
    expect(screen.getByText('TAG1')).toBeTruthy();
  });

  it('should add a free type with tag via UI', async () => {
    const user = userEvent.setup();
    const { component } = await setup({ instruction: minInstruction() });
    await user.type(screen.getByLabelText('type'), ' t9 ');
    await user.type(screen.getByLabelText('type tag'), ' g ');
    await user.click(screen.getByRole('button', { description: 'Add type' }));
    expect(component.types.value).toEqual([
      { value: 't1' },
      { value: 't9', tag: 'g' },
    ]);
    expect(component.types.dirty).toBe(true);
    // type form was reset
    expect(component.type.value).toBe('');
    expect(component.typeTag.value).toBeNull();
    expect(screen.getByText('t9')).toBeTruthy();
  });

  it('should not save the whole instruction when adding a type', async () => {
    // the outer form is valid here: a bubbling submit from the nested
    // type form would trigger save() and close the editor in the parent
    const user = userEvent.setup();
    const { component, instructionChange } = await setup({
      instruction: minInstruction(),
    });
    await user.type(screen.getByLabelText('type'), 't2');
    await user.click(screen.getByRole('button', { description: 'Add type' }));
    expect(component.types.value.length).toBe(2);
    expect(instructionChange).not.toHaveBeenCalled();
    // same when pressing Enter in the type input
    await user.type(screen.getByLabelText('type'), 't3{Enter}');
    expect(component.types.value.length).toBe(3);
    expect(instructionChange).not.toHaveBeenCalled();
  });

  it('should add a type with no tag as undefined tag', async () => {
    const { component } = await setup({ instruction: minInstruction() });
    component.type.setValue('t2');
    component.typeTag.setValue('  ');
    component.addType();
    expect(component.types.value[1]).toEqual({ value: 't2', tag: undefined });
  });

  it('should not add an invalid type', async () => {
    const { component } = await setup({ instruction: minInstruction() });
    component.addType();
    expect(component.types.value.length).toBe(1);
    expect(component.type.touched).toBe(true);
  });

  it('should add a type picked from thesauri', async () => {
    const user = userEvent.setup();
    const { component } = await setup({
      instruction: minInstruction(),
      inputs: {
        instrTypeEntries: entries('t1', 't2'),
        instrTypeTagEntries: entries('g1', 'g2'),
      },
    });
    const [typeSelect, tagSelect] = screen.getAllByRole('combobox');
    await user.click(typeSelect);
    await user.click(await screen.findByRole('option', { name: 'T2' }));
    await user.click(tagSelect);
    await user.click(await screen.findByRole('option', { name: 'G2' }));
    await user.click(screen.getByRole('button', { description: 'Add type' }));
    expect(component.types.value[1]).toEqual({ value: 't2', tag: 'g2' });
  });

  it('should delete a type via UI', async () => {
    const user = userEvent.setup();
    const { component } = await setup({ instruction: fullInstruction() });
    await user.click(
      screen.getAllByRole('button', { description: 'Delete this type' })[0],
    );
    expect(component.types.value).toEqual([{ value: 't2' }]);
    expect(component.types.dirty).toBe(true);
  });

  it('should move types up and down', async () => {
    const user = userEvent.setup();
    const { component } = await setup({ instruction: fullInstruction() });
    const up = screen.getAllByRole('button', {
      description: 'Move this type up',
    });
    const down = screen.getAllByRole('button', {
      description: 'Move this type down',
    });
    expect((up[0] as HTMLButtonElement).disabled).toBe(true);
    expect((down[1] as HTMLButtonElement).disabled).toBe(true);
    await user.click(down[0]);
    expect(component.types.value.map((t) => t.value)).toEqual(['t2', 't1']);
    await user.click(
      screen.getAllByRole('button', { description: 'Move this type up' })[1],
    );
    expect(component.types.value.map((t) => t.value)).toEqual(['t1', 't2']);
    // out of range moves are ignored
    component.moveTypeUp(0);
    component.moveTypeDown(1);
    expect(component.types.value.map((t) => t.value)).toEqual(['t1', 't2']);
  });
  //#endregion

  //#region General tab fields
  it('should use a select for script with thesaurus', async () => {
    const user = userEvent.setup();
    const { component } = await setup({
      instruction: minInstruction(),
      inputs: { instrScriptEntries: entries('latin', 'greek') },
    });
    const select = screen
      .getAllByRole('combobox')
      .find((e) => e.textContent?.includes('LATIN'))!;
    await user.click(select);
    await user.click(await screen.findByRole('option', { name: 'GREEK' }));
    expect(component.script.value).toBe('greek');
  });

  it('should use a select for position with thesaurus', async () => {
    const user = userEvent.setup();
    const { component } = await setup({
      instruction: minInstruction(),
      inputs: { instrPositionEntries: entries('top', 'bottom') },
    });
    const select = screen
      .getAllByRole('combobox')
      .find((e) => e.textContent?.includes('TOP'))!;
    await user.click(select);
    await user.click(await screen.findByRole('option', { name: 'BOTTOM' }));
    expect(component.position.value).toBe('bottom');
  });

  it('should show required errors for script and position', async () => {
    const user = userEvent.setup();
    await setup({ instruction: minInstruction() });
    await user.clear(screen.getByLabelText('script'));
    await user.clear(screen.getByLabelText('position'));
    await user.tab();
    expect(await screen.findByText('script required')).toBeTruthy();
    expect(await screen.findByText('position required')).toBeTruthy();
  });

  it('should use free subject input without subjects thesaurus', async () => {
    const { fixture } = await setup({ instruction: fullInstruction() });
    expect(screen.getByLabelText('subject')).toBeInstanceOf(HTMLInputElement);
    expect(
      stub<ThesaurusTreeStubComponent>(fixture, 'cadmus-thesaurus-tree'),
    ).toBeUndefined();
  });

  it('should pick subject from thesaurus tree', async () => {
    const subjects = entries('a.b', 'a.c');
    const { component, fixture, refresh } = await setup({
      instruction: fullInstruction(),
      inputs: { instrSubjectEntries: subjects },
    });
    expect(screen.queryByLabelText('subject')).toBeNull();
    const tree = stub<ThesaurusTreeStubComponent>(
      fixture,
      'cadmus-thesaurus-tree',
    );
    expect(tree.entries()).toEqual(subjects);
    expect(tree.renderLabel()!('x:y')).toBe(component.renderLabel('x:y'));
    tree.entryChange.emit({ id: 'a.c', value: 'A.C' });
    await refresh();
    expect(component.subject.value).toBe('A.C');
    expect(component.subject.dirty).toBe(true);
    expect(document.getElementById('selected-subject')!.textContent).toBe(
      'A.C',
    );
  });

  it('should bind language flags', async () => {
    const { component, fixture } = await setup({
      instruction: fullInstruction(),
      inputs: { instrLanguageEntries: entries('lat', 'grc') },
    });
    expect(component.languageFlags()).toEqual([
      { id: 'lat', label: 'LAT' },
      { id: 'grc', label: 'GRC' },
    ]);
    const flags = stub<FlagSetStubComponent>(fixture, 'cadmus-ui-flag-set');
    expect(flags.flags()).toEqual(component.languageFlags());
    expect(flags.checkedIds()).toEqual(['lat']);
    flags.checkedIdsChange.emit(['grc']);
    expect(component.languages.value).toEqual(['grc']);
    expect(component.languages.dirty).toBe(true);
  });

  it('should not render flag sets without thesauri', async () => {
    const { component, fixture } = await setup({
      instruction: fullInstruction(),
    });
    expect(component.languageFlags()).toEqual([]);
    expect(component.featureFlags()).toEqual([]);
    expect(component.toolFlags()).toEqual([]);
    expect(component.colorFlags()).toEqual([]);
    expect(stub(fixture, 'cadmus-ui-flag-set')).toBeUndefined();
  });

  it('should toggle date editor and bind date', async () => {
    const user = userEvent.setup();
    const { component, fixture } = await setup({
      instruction: minInstruction(),
    });
    expect(stub(fixture, 'cadmus-refs-historical-date')).toBeUndefined();
    await user.click(screen.getByRole('checkbox', { name: 'date' }));
    expect(component.hasDate.value).toBe(true);
    const date = stub<HistoricalDateStubComponent>(
      fixture,
      'cadmus-refs-historical-date',
    );
    expect(date).toBeTruthy();
    expect(date.date()).toBeUndefined();
    const d: HistoricalDateModel = { a: { value: 1300 } };
    date.dateChange.emit(d);
    expect(component.date.value).toEqual(d);
    expect(component.date.dirty).toBe(true);
  });

  it('should pass existing date to date editor', async () => {
    const { fixture } = await setup({ instruction: fullInstruction() });
    const date = stub<HistoricalDateStubComponent>(
      fixture,
      'cadmus-refs-historical-date',
    );
    expect(date.date()).toEqual({ a: { value: 1200 } });
  });

  it('should bind assertion', async () => {
    const { component, fixture } = await setup({
      instruction: fullInstruction(),
      inputs: {
        assTagEntries: entries('at'),
        docRefTypeEntries: entries('rt'),
        docRefTagEntries: entries('rg'),
      },
    });
    const ass = stub<AssertionStubComponent>(fixture, 'cadmus-refs-assertion');
    expect(ass.assertion()).toEqual({ rank: 1 });
    expect(ass.assTagEntries()).toEqual(entries('at'));
    expect(ass.refTypeEntries()).toEqual(entries('rt'));
    expect(ass.refTagEntries()).toEqual(entries('rg'));
    ass.assertionChange.emit({ rank: 3 });
    expect(component.assertion.value).toEqual({ rank: 3 });
    expect(component.assertion.dirty).toBe(true);
  });
  //#endregion

  //#region Diffs
  it('should list diffs in implementation tab', async () => {
    await setup({
      instruction: fullInstruction(),
      inputs: { instrDiffTypeEntries: entries('d1') },
    });
    await openTab('Implementation');
    expect(await screen.findByText('D1')).toBeTruthy();
    expect(screen.getByText('x')).toBeTruthy();
  });

  it('should add a diff with default type from thesaurus', async () => {
    const { component } = await setup({
      instruction: minInstruction(),
      inputs: { instrDiffTypeEntries: entries('d1', 'd2') },
    });
    component.addDiff();
    expect(component.editedDiffIndex()).toBe(-1);
    expect(component.editedDiff()).toEqual({ type: 'd1' });
  });

  it('should add a diff with empty type without thesaurus', async () => {
    const { component } = await setup({ instruction: minInstruction() });
    component.addDiff();
    expect(component.editedDiff()).toEqual({ type: '' });
  });

  it('should add a new diff via diff editor', async () => {
    const user = userEvent.setup();
    const { component } = await setup({ instruction: minInstruction() });
    await openTab('Implementation');
    await user.click(await screen.findByRole('button', { name: /diff/ }));
    const editor = document.querySelector(
      'cadmus-ico-instruction-diff-editor',
    ) as HTMLElement;
    expect(editor).toBeTruthy();
    await user.type(within(editor).getByLabelText('type'), 'new');
    await user.click(
      within(editor).getByRole('button', { description: 'Accept changes' }),
    );
    expect(component.differences.value).toEqual([
      { type: 'new', target: undefined, note: undefined },
    ]);
    expect(component.differences.dirty).toBe(true);
    expect(component.editedDiff()).toBeUndefined();
    expect(component.editedDiffIndex()).toBe(-1);
  });

  it('should edit an existing diff replacing it', async () => {
    const user = userEvent.setup();
    const { component } = await setup({ instruction: fullInstruction() });
    await openTab('Implementation');
    await user.click(
      await screen.findByRole('button', { description: 'Edit this diff' }),
    );
    expect(component.editedDiffIndex()).toBe(0);
    // edited copy is a clone
    expect(component.editedDiff()).toEqual(fullInstruction().differences![0]);
    expect(component.editedDiff()).not.toBe(component.differences.value[0]);
    component.saveDiff({ type: 'd9' });
    expect(component.differences.value).toEqual([{ type: 'd9' }]);
  });

  it('should close diff editor on cancel', async () => {
    const user = userEvent.setup();
    const { component } = await setup({ instruction: fullInstruction() });
    await openTab('Implementation');
    await user.click(
      await screen.findByRole('button', { description: 'Edit this diff' }),
    );
    const editor = document.querySelector(
      'cadmus-ico-instruction-diff-editor',
    ) as HTMLElement;
    await user.click(
      within(editor).getByRole('button', { description: 'Discard changes' }),
    );
    expect(component.editedDiff()).toBeUndefined();
    expect(component.differences.value.length).toBe(1);
  });

  it('should delete a diff upon confirmation', async () => {
    const user = userEvent.setup();
    const { component, dialogService } = await setup({
      instruction: fullInstruction(),
    });
    await openTab('Implementation');
    await user.click(
      await screen.findByRole('button', { description: 'Delete this diff' }),
    );
    expect(dialogService.confirm).toHaveBeenCalledWith(
      'Confirmation',
      'Delete diff #1?',
    );
    expect(component.differences.value).toEqual([]);
    expect(component.differences.dirty).toBe(true);
  });

  it('should not delete a diff without confirmation', async () => {
    const { component } = await setup({
      instruction: fullInstruction(),
      confirm: false,
    });
    component.deleteDiff(0);
    expect(component.differences.value.length).toBe(1);
  });

  it('should close the diff editor when deleting the edited diff', async () => {
    const { component } = await setup({ instruction: fullInstruction() });
    component.editDiff(component.differences.value[0], 0);
    component.deleteDiff(0);
    expect(component.editedDiff()).toBeUndefined();
    expect(component.editedDiffIndex()).toBe(-1);
  });

  it('should keep tracking the edited diff when deleting a previous one', async () => {
    const instruction = fullInstruction();
    instruction.differences = [{ type: 'a' }, { type: 'b' }, { type: 'c' }];
    const { component } = await setup({ instruction });
    component.editDiff(component.differences.value[2], 2);
    component.deleteDiff(0);
    expect(component.editedDiffIndex()).toBe(1);
    component.saveDiff({ type: 'C' });
    expect(component.differences.value).toEqual([{ type: 'b' }, { type: 'C' }]);
  });

  it('should move diffs up and down', async () => {
    const instruction = fullInstruction();
    instruction.differences = [{ type: 'a' }, { type: 'b' }, { type: 'c' }];
    const { component } = await setup({ instruction });
    component.moveDiffDown(0);
    expect(component.differences.value.map((d) => d.type)).toEqual([
      'b',
      'a',
      'c',
    ]);
    component.moveDiffUp(2);
    expect(component.differences.value.map((d) => d.type)).toEqual([
      'b',
      'c',
      'a',
    ]);
    expect(component.differences.dirty).toBe(true);
    component.moveDiffUp(0);
    component.moveDiffDown(2);
    expect(component.differences.value.map((d) => d.type)).toEqual([
      'b',
      'c',
      'a',
    ]);
  });

  it('should keep tracking the edited diff when moving diffs', async () => {
    const instruction = fullInstruction();
    instruction.differences = [{ type: 'a' }, { type: 'b' }, { type: 'c' }];
    const { component } = await setup({ instruction });
    component.editDiff(component.differences.value[1], 1);
    // [a,b,c] -> [b,a,c]
    component.moveDiffUp(1);
    expect(component.editedDiffIndex()).toBe(0);
    // moving other items does not affect it
    component.moveDiffDown(1);
    expect(component.editedDiffIndex()).toBe(0);
    // [b,c,a] -> [c,b,a]
    component.moveDiffDown(0);
    expect(component.editedDiffIndex()).toBe(1);
    // [c,b,a] -> [c,a,b]
    component.moveDiffUp(2);
    expect(component.editedDiffIndex()).toBe(2);
    component.saveDiff({ type: 'B' });
    expect(component.differences.value.map((d) => d.type)).toEqual([
      'c',
      'a',
      'B',
    ]);
  });

  it('should move diffs via UI buttons', async () => {
    const user = userEvent.setup();
    const instruction = fullInstruction();
    instruction.differences = [{ type: 'a' }, { type: 'b' }];
    const { component } = await setup({ instruction });
    await openTab('Implementation');
    const down = await screen.findAllByRole('button', {
      description: 'Move this diff down',
    });
    await user.click(down[0]);
    expect(component.differences.value.map((d) => d.type)).toEqual(['b', 'a']);
    await user.click(
      screen.getAllByRole('button', { description: 'Move this diff up' })[1],
    );
    expect(component.differences.value.map((d) => d.type)).toEqual(['a', 'b']);
  });
  //#endregion

  //#region Description tab
  it('should bind feature, tool and color flags', async () => {
    const { component, fixture } = await setup({
      instruction: fullInstruction(),
      inputs: {
        instrFeatEntries: entries('f1', 'f2'),
        instrToolEntries: entries('pen'),
        instrColorEntries: entries('red', 'blue'),
      },
    });
    await openTab('Description', 'cadmus-ui-flag-set');
    const sets = fixture.debugElement
      .queryAll(
        (e) => e.nativeElement?.tagName?.toLowerCase() === 'cadmus-ui-flag-set',
      )
      .map((e) => e.componentInstance as FlagSetStubComponent);
    expect(sets.length).toBe(3);
    const [feats, tools, colors] = sets;
    expect(feats.checkedIds()).toEqual(['f1']);
    expect(tools.checkedIds()).toEqual(['pen']);
    expect(colors.checkedIds()).toEqual(['red']);
    feats.checkedIdsChange.emit(['f2']);
    tools.checkedIdsChange.emit([]);
    colors.checkedIdsChange.emit(['red', 'blue']);
    expect(component.features.value).toEqual(['f2']);
    expect(component.tools.value).toEqual([]);
    expect(component.colors.value).toEqual(['red', 'blue']);
    expect(component.features.dirty).toBe(true);
    expect(component.tools.dirty).toBe(true);
    expect(component.colors.dirty).toBe(true);
  });

  it('should list color reuses with looked-up labels', async () => {
    await setup({
      instruction: fullInstruction(),
      inputs: { instrColorEntries: entries('red') },
    });
    await openTab('Description');
    expect(await screen.findByText('RED')).toBeTruthy();
    expect(screen.getByText('3r')).toBeTruthy();
  });

  it('should add a color reuse with default color from thesaurus', async () => {
    const { component } = await setup({
      instruction: minInstruction(),
      inputs: { instrColorEntries: entries('red', 'blue') },
    });
    component.addColorReuse();
    expect(component.editedReuseIndex()).toBe(-1);
    expect(component.editedReuse()).toEqual({ color: 'red', location: '' });
  });

  it('should add a new color reuse via editor', async () => {
    const user = userEvent.setup();
    const { component } = await setup({ instruction: minInstruction() });
    await openTab('Description');
    await user.click(
      await screen.findByRole('button', { name: /color reuse/ }),
    );
    expect(component.editedReuse()).toEqual({ color: '', location: '' });
    const editor = document.querySelector(
      'cadmus-ico-color-reuse-editor',
    ) as HTMLElement;
    await user.type(within(editor).getByLabelText('color'), 'green');
    await user.type(within(editor).getByLabelText('location'), '5r');
    await user.click(
      within(editor).getByRole('button', { description: 'Accept changes' }),
    );
    expect(component.colorReuses.value).toEqual([
      { color: 'green', location: '5r', note: undefined },
    ]);
    expect(component.colorReuses.dirty).toBe(true);
    expect(component.editedReuse()).toBeUndefined();
  });

  it('should edit an existing color reuse replacing it', async () => {
    const user = userEvent.setup();
    const { component } = await setup({ instruction: fullInstruction() });
    await openTab('Description');
    await user.click(
      await screen.findByRole('button', {
        description: 'Edit this color reuse',
      }),
    );
    expect(component.editedReuseIndex()).toBe(0);
    expect(component.editedReuse()).not.toBe(component.colorReuses.value[0]);
    component.saveColorReuse({ color: 'blue', location: '9v' });
    expect(component.colorReuses.value).toEqual([
      { color: 'blue', location: '9v' },
    ]);
  });

  it('should close color reuse editor on cancel', async () => {
    const user = userEvent.setup();
    const { component } = await setup({ instruction: fullInstruction() });
    await openTab('Description');
    await user.click(
      await screen.findByRole('button', {
        description: 'Edit this color reuse',
      }),
    );
    const editor = document.querySelector(
      'cadmus-ico-color-reuse-editor',
    ) as HTMLElement;
    await user.click(
      within(editor).getByRole('button', { description: 'Discard changes' }),
    );
    expect(component.editedReuse()).toBeUndefined();
    expect(component.editedReuseIndex()).toBe(-1);
  });

  it('should delete a color reuse upon confirmation', async () => {
    const user = userEvent.setup();
    const { component, dialogService } = await setup({
      instruction: fullInstruction(),
    });
    await openTab('Description');
    await user.click(
      await screen.findByRole('button', {
        description: 'Delete this color reuse',
      }),
    );
    expect(dialogService.confirm).toHaveBeenCalledWith(
      'Confirmation',
      'Delete color reuse #1?',
    );
    expect(component.colorReuses.value).toEqual([]);
  });

  it('should not delete a color reuse without confirmation', async () => {
    const { component } = await setup({
      instruction: fullInstruction(),
      confirm: false,
    });
    component.deleteColorReuse(0);
    expect(component.colorReuses.value.length).toBe(1);
  });

  it('should close the reuse editor when deleting the edited reuse', async () => {
    const { component } = await setup({ instruction: fullInstruction() });
    component.editColorReuse(component.colorReuses.value[0], 0);
    component.deleteColorReuse(0);
    expect(component.editedReuse()).toBeUndefined();
  });

  it('should keep tracking the edited reuse when deleting a previous one', async () => {
    const instruction = fullInstruction();
    instruction.colorReuses = [
      { color: 'a', location: '1' },
      { color: 'b', location: '2' },
    ];
    const { component } = await setup({ instruction });
    component.editColorReuse(component.colorReuses.value[1], 1);
    component.deleteColorReuse(0);
    expect(component.editedReuseIndex()).toBe(0);
    component.saveColorReuse({ color: 'B', location: '2' });
    expect(component.colorReuses.value).toEqual([
      { color: 'B', location: '2' },
    ]);
  });

  it('should move color reuses and keep tracking the edited one', async () => {
    const instruction = fullInstruction();
    instruction.colorReuses = [
      { color: 'a', location: '1' },
      { color: 'b', location: '2' },
      { color: 'c', location: '3' },
    ];
    const { component } = await setup({ instruction });
    component.editColorReuse(component.colorReuses.value[0], 0);
    component.moveColorReuseDown(0);
    expect(component.colorReuses.value.map((r) => r.color)).toEqual([
      'b',
      'a',
      'c',
    ]);
    expect(component.editedReuseIndex()).toBe(1);
    component.moveColorReuseUp(2);
    expect(component.colorReuses.value.map((r) => r.color)).toEqual([
      'b',
      'c',
      'a',
    ]);
    expect(component.editedReuseIndex()).toBe(2);
    // out of range
    component.moveColorReuseUp(0);
    component.moveColorReuseDown(2);
    expect(component.colorReuses.value.map((r) => r.color)).toEqual([
      'b',
      'c',
      'a',
    ]);
    expect(component.colorReuses.dirty).toBe(true);
  });

  it('should move color reuses via UI buttons', async () => {
    const user = userEvent.setup();
    const instruction = fullInstruction();
    instruction.colorReuses = [
      { color: 'a', location: '1' },
      { color: 'b', location: '2' },
    ];
    const { component } = await setup({ instruction });
    await openTab('Description');
    const down = await screen.findAllByRole('button', {
      description: 'Move this color reuse down',
    });
    await user.click(down[0]);
    expect(component.colorReuses.value.map((r) => r.color)).toEqual([
      'b',
      'a',
    ]);
    await user.click(
      screen.getAllByRole('button', {
        description: 'Move this color reuse up',
      })[1],
    );
    expect(component.colorReuses.value.map((r) => r.color)).toEqual([
      'a',
      'b',
    ]);
  });
  //#endregion

  //#region Links
  it('should bind links', async () => {
    const options: LookupProviderOptions = {} as LookupProviderOptions;
    const { component, fixture } = await setup({
      instruction: fullInstruction(),
      inputs: {
        assIdTagEntries: entries('it'),
        assIdScopeEntries: entries('is'),
        idFeatureEntries: entries('if'),
        lookupProviderOptions: options,
      },
    });
    await openTab('Links', 'cadmus-refs-asserted-composite-ids');
    const ids = stub<AssertedCompositeIdsStubComponent>(
      fixture,
      'cadmus-refs-asserted-composite-ids',
    );
    expect(ids.ids()).toEqual(fullInstruction().links);
    expect(ids.idTagEntries()).toEqual(entries('it'));
    expect(ids.idScopeEntries()).toEqual(entries('is'));
    expect(ids.featureEntries()).toEqual(entries('if'));
    expect(ids.lookupProviderOptions()).toBe(options);
    expect(ids.canSwitchMode()).toBe(true);
    expect(ids.canEditTarget()).toBe(true);
    const links: AssertedCompositeId[] = [
      { target: { gid: 'x', label: 'X' } },
    ];
    ids.idsChange.emit(links);
    expect(component.links.value).toEqual(links);
    expect(component.links.dirty).toBe(true);
  });
  //#endregion

  //#region Save and cancel
  it('should disable save button when pristine', async () => {
    await setup({ instruction: minInstruction() });
    expect(
      (
        screen.getByRole('button', {
          description: 'Accept changes',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });

  it('should save full instruction via UI', async () => {
    const user = userEvent.setup();
    const { instructionChange, component } = await setup({
      instruction: fullInstruction(),
    });
    await user.clear(screen.getByLabelText('EID'));
    await user.type(screen.getByLabelText('EID'), 'i2');
    await user.click(
      screen.getByRole('button', { description: 'Accept changes' }),
    );
    expect(instructionChange).toHaveBeenCalledTimes(1);
    expect(instructionChange).toHaveBeenCalledWith({
      ...fullInstruction(),
      eid: 'i2',
    });
    expect(component.form.pristine).toBe(true);
  });

  it('should save a minimal instruction with undefined optional fields', async () => {
    const { component, instructionChange } = await setup({
      instruction: minInstruction(),
    });
    component.save();
    expect(instructionChange).toHaveBeenCalledWith({
      eid: undefined,
      types: [{ value: 't1' }],
      subject: undefined,
      script: 'latin',
      text: undefined,
      sequences: undefined,
      repertoire: undefined,
      location: '1r',
      position: 'top',
      positionNote: undefined,
      targetLocation: undefined,
      implementation: undefined,
      differences: undefined,
      note: undefined,
      description: undefined,
      features: undefined,
      languages: undefined,
      tools: undefined,
      colors: undefined,
      colorReuses: undefined,
      links: undefined,
      date: undefined,
      assertion: undefined,
    });
  });

  it('should save no date when has-date is unchecked', async () => {
    const { component, instructionChange } = await setup({
      instruction: fullInstruction(),
    });
    component.hasDate.setValue(false);
    component.save();
    expect(instructionChange.mock.calls[0][0].date).toBeUndefined();
  });

  it('should split sequences on whitespace', async () => {
    const { component, instructionChange } = await setup({
      instruction: minInstruction(),
    });
    component.sequences.setValue('  a   b\nc  ');
    component.save();
    expect(instructionChange.mock.calls[0][0].sequences).toEqual([
      'a',
      'b',
      'c',
    ]);
  });

  it('should save undefined sequences when cleared', async () => {
    const user = userEvent.setup();
    const { component, instructionChange } = await setup({
      instruction: fullInstruction(),
    });
    // clearing a textarea sets an empty string, not null
    await user.clear(screen.getByLabelText('sequences'));
    expect(component.sequences.value).toBe('');
    component.save();
    expect(instructionChange.mock.calls[0][0].sequences).toBeUndefined();
  });

  it('should keep form dirty when saving with pristine=false', async () => {
    const { component, instructionChange } = await setup({
      instruction: minInstruction(),
    });
    component.note.setValue('n');
    component.form.markAsDirty();
    component.save(false);
    expect(instructionChange).toHaveBeenCalled();
    expect(component.form.dirty).toBe(true);
  });

  it('should not save an invalid instruction', async () => {
    const { component, instructionChange } = await setup({
      instruction: minInstruction(),
    });
    component.types.setValue([]);
    component.save();
    expect(instructionChange).not.toHaveBeenCalled();
    expect(component.types.touched).toBe(true);
  });

  it('should emit cancelEdit on cancel', async () => {
    const user = userEvent.setup();
    const { cancelEdit, instructionChange } = await setup({
      instruction: minInstruction(),
    });
    await user.click(
      screen.getByRole('button', { description: 'Discard changes' }),
    );
    expect(cancelEdit).toHaveBeenCalledTimes(1);
    expect(instructionChange).not.toHaveBeenCalled();
  });
  //#endregion
});
