import { Component, input, model, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { BehaviorSubject, of } from 'rxjs';

import { AuthJwtService, User } from '@myrmidon/auth-jwt-login';
import {
  EditedObject,
  PartIdentity,
  ThesauriSet,
  ThesaurusEntry,
} from '@myrmidon/cadmus-core';
import { AppRepository } from '@myrmidon/cadmus-state';
import { CloseSaveButtonsComponent, EditorHelpService } from '@myrmidon/cadmus-ui';
import { DialogService } from '@myrmidon/ngx-mat-tools';
import { FlatLookupPipe } from '@myrmidon/ngx-tools';
import { LookupProviderOptions } from '@myrmidon/cadmus-refs-lookup';

import {
  ICO_INSTRUCTIONS_PART_TYPEID,
  IcoInstruction,
  IcoInstructionsPart,
} from '../ico-instructions-part';
import { IcoInstructionsPartComponent } from './ico-instructions-part.component';

// stub mirroring the instruction editor API
@Component({ selector: 'cadmus-ico-instructions-editor', template: '' })
class InstructionEditorStubComponent {
  public readonly instruction = model<IcoInstruction | undefined>();
  public readonly cancelEdit = output();
  public readonly instrTypeTagEntries = input<ThesaurusEntry[]>();
  public readonly instrTypeEntries = input<ThesaurusEntry[]>();
  public readonly instrSubjectEntries = input<ThesaurusEntry[]>();
  public readonly instrScriptEntries = input<ThesaurusEntry[]>();
  public readonly instrPositionEntries = input<ThesaurusEntry[]>();
  public readonly instrDiffTypeEntries = input<ThesaurusEntry[]>();
  public readonly instrFeatEntries = input<ThesaurusEntry[]>();
  public readonly instrLanguageEntries = input<ThesaurusEntry[]>();
  public readonly instrToolEntries = input<ThesaurusEntry[]>();
  public readonly instrColorEntries = input<ThesaurusEntry[]>();
  public readonly assTagEntries = input<ThesaurusEntry[]>();
  public readonly docRefTypeEntries = input<ThesaurusEntry[]>();
  public readonly docRefTagEntries = input<ThesaurusEntry[]>();
  public readonly assIdScopeEntries = input<ThesaurusEntry[]>();
  public readonly assIdTagEntries = input<ThesaurusEntry[]>();
  public readonly idFeatureEntries = input<ThesaurusEntry[]>();
  public readonly lookupProviderOptions = input<LookupProviderOptions>();
}

// thesaurus key -> component signal name
const THESAURI_SIGNALS: Record<string, keyof IcoInstructionsPartComponent> = {
  'ico-instruction-types': 'instrTypeEntries',
  'ico-instruction-type-tags': 'instrTypeTagEntries',
  'ico-instruction-subjects': 'instrSubjectEntries',
  'ico-instruction-scripts': 'instrScriptEntries',
  'ico-instruction-diff-types': 'instrDiffTypeEntries',
  'ico-instruction-positions': 'instrPositionEntries',
  'ico-instruction-feats': 'instrFeatEntries',
  'ico-instruction-languages': 'instrLangEntries',
  'ico-instruction-tools': 'instrToolEntries',
  'ico-instruction-colors': 'instrColorEntries',
  'assertion-tags': 'assTagEntries',
  'doc-reference-types': 'docRefTypeEntries',
  'doc-reference-tags': 'docRefTagEntries',
  'asserted-id-scopes': 'assIdScopeEntries',
  'asserted-id-tags': 'assIdTagEntries',
  'asserted-id-features': 'assIdFeatureEntries',
};

// thesaurus key -> instruction editor input name
const THESAURI_INPUTS: Record<string, keyof InstructionEditorStubComponent> = {
  'ico-instruction-types': 'instrTypeEntries',
  'ico-instruction-type-tags': 'instrTypeTagEntries',
  'ico-instruction-subjects': 'instrSubjectEntries',
  'ico-instruction-scripts': 'instrScriptEntries',
  'ico-instruction-diff-types': 'instrDiffTypeEntries',
  'ico-instruction-positions': 'instrPositionEntries',
  'ico-instruction-feats': 'instrFeatEntries',
  'ico-instruction-languages': 'instrLanguageEntries',
  'ico-instruction-tools': 'instrToolEntries',
  'ico-instruction-colors': 'instrColorEntries',
  'assertion-tags': 'assTagEntries',
  'doc-reference-types': 'docRefTypeEntries',
  'doc-reference-tags': 'docRefTagEntries',
  'asserted-id-scopes': 'assIdScopeEntries',
  'asserted-id-tags': 'assIdTagEntries',
  'asserted-id-features': 'idFeatureEntries',
};

function buildThesauri(keys: string[]): ThesauriSet {
  const set: ThesauriSet = {};
  for (const key of keys) {
    set[key] = {
      id: key + '@en',
      language: 'en',
      entries: [
        { id: key + '.a', value: key.toUpperCase() + ' A' },
        { id: key + '.b', value: key.toUpperCase() + ' B' },
      ],
    };
  }
  return set;
}

function instr(location: string, extra?: Partial<IcoInstruction>) {
  return {
    types: [{ value: 'type' }],
    script: 'latin',
    location,
    position: 'top',
    ...(extra || {}),
  } as IcoInstruction;
}

/**
 * A copy of value without the identity tags a signal form adds to the
 * objects in its arrays, for comparing form values.
 */
function plain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

/**
 * True if value or any object nested in it has own Symbol keys.
 */
function hasSymbols(value: unknown): boolean {
  if (!value || typeof value !== 'object') {
    return false;
  }
  return (
    Object.getOwnPropertySymbols(value).length > 0 ||
    Object.values(value).some((v) => hasSymbols(v))
  );
}

function buildPart(instructions: IcoInstruction[]): IcoInstructionsPart {
  return {
    id: 'p1',
    itemId: 'item1',
    typeId: ICO_INSTRUCTIONS_PART_TYPEID,
    roleId: undefined,
    timeCreated: new Date(),
    creatorId: 'zeus',
    timeModified: new Date(),
    userId: 'zeus',
    instructions,
  };
}

const IDENTITY: PartIdentity = {
  itemId: 'item1',
  typeId: ICO_INSTRUCTIONS_PART_TYPEID,
  partId: 'p1',
  roleId: 'r1',
};

interface SetupOptions {
  part?: IcoInstructionsPart | null;
  thesauri?: ThesauriSet;
  roles?: string[];
  confirm?: boolean;
  settings?: Promise<unknown>;
  identity?: PartIdentity;
}

async function setup(options: SetupOptions = {}) {
  const user: Partial<User> = {
    userName: 'zeus',
    roles: options.roles ?? ['admin'],
  };
  const authService = {
    currentUserValue: user,
    currentUser$: new BehaviorSubject(user),
  };
  const appRepository = {
    getSettingFor: vi
      .fn()
      .mockReturnValue(options.settings ?? Promise.resolve(undefined)),
    getTypeThesaurus: vi.fn().mockReturnValue(undefined),
  };
  const helpService = {
    resolveUrl: vi.fn().mockResolvedValue(undefined),
  };
  const dialogService = {
    confirm: vi.fn().mockReturnValue(of(options.confirm ?? true)),
  };
  const dataChange = vi.fn();
  const editorClose = vi.fn();
  const dirtyChange = vi.fn();

  const data: EditedObject<IcoInstructionsPart> | undefined =
    options.part === null
      ? undefined
      : {
          value: options.part ?? buildPart([]),
          thesauri: options.thesauri ?? {},
        };

  const result = await render(IcoInstructionsPartComponent, {
    inputs: { identity: options.identity ?? IDENTITY, data },
    on: { editorClose, dirtyChange },
    providers: [
      { provide: AuthJwtService, useValue: authService },
      { provide: AppRepository, useValue: appRepository },
      { provide: EditorHelpService, useValue: helpService },
      { provide: DialogService, useValue: dialogService },
    ],
    componentImports: [
      CommonModule,
      MatButtonModule,
      MatCardModule,
      MatExpansionModule,
      MatFormFieldModule,
      MatIconModule,
      MatInputModule,
      MatSelectModule,
      MatTooltipModule,
      CloseSaveButtonsComponent,
      FlatLookupPipe,
      InstructionEditorStubComponent,
    ],
  });
  const component = result.fixture.componentInstance;
  component.data.subscribe(dataChange);
  await result.fixture.whenStable();

  const getEditor = () =>
    result.fixture.debugElement.query(
      (e) =>
        e.nativeElement?.tagName?.toLowerCase() ===
        'cadmus-ico-instructions-editor',
    )?.componentInstance as InstructionEditorStubComponent | undefined;

  return {
    ...result,
    component,
    appRepository,
    dialogService,
    authService,
    dataChange,
    editorClose,
    dirtyChange,
    getEditor,
  };
}

describe('IcoInstructionsPartComponent', () => {
  //#region Init
  it('should create with an empty invalid form', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
    expect(plain(component.form.instructions().value())).toEqual([]);
    // at least 1 instruction is required
    expect(component.form().invalid()).toBe(true);
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('should show default title', async () => {
    await setup();
    expect(screen.getByText('Iconographic Instructions Part')).toBeTruthy();
  });

  it('should reset the form when data is undefined', async () => {
    const { component } = await setup({ part: null });
    expect(plain(component.form.instructions().value())).toEqual([]);
  });

  it('should load instructions from data', async () => {
    const instructions = [instr('1r'), instr('2v')];
    const { component } = await setup({ part: buildPart(instructions) });
    expect(plain(component.form.instructions().value())).toEqual(instructions);
    expect(component.form().valid()).toBe(true);
    expect(component.form().dirty()).toBe(false);
    expect(screen.getAllByRole('row').length).toBe(3);
  });

  it('should set all thesauri entries when present', async () => {
    const keys = Object.keys(THESAURI_SIGNALS);
    const thesauri = buildThesauri(keys);
    const { component } = await setup({ thesauri });
    for (const key of keys) {
      const signal = component[THESAURI_SIGNALS[key]] as () => unknown;
      expect(signal(), key).toEqual(thesauri[key].entries);
    }
  });

  it('should set thesauri entries to undefined when missing', async () => {
    const { component } = await setup({
      thesauri: buildThesauri(['ico-instruction-types']),
    });
    expect(component.instrTypeEntries()).toBeTruthy();
    for (const key of Object.keys(THESAURI_SIGNALS)) {
      if (key === 'ico-instruction-types') continue;
      const signal = component[THESAURI_SIGNALS[key]] as () => unknown;
      expect(signal(), key).toBeUndefined();
    }
  });

  it('should load lookup options from settings for role', async () => {
    const options = { x: 1 } as unknown as LookupProviderOptions;
    const { component, appRepository } = await setup({
      settings: Promise.resolve({ lookupProviderOptions: options }),
    });
    expect(appRepository.getSettingFor).toHaveBeenCalledWith(
      ICO_INSTRUCTIONS_PART_TYPEID,
      'r1',
    );
    await waitFor(() =>
      expect(component.lookupProviderOptions()).toBe(options),
    );
  });

  it('should request settings without role when no role', async () => {
    const { appRepository } = await setup({
      identity: { ...IDENTITY, roleId: null },
    });
    expect(appRepository.getSettingFor).toHaveBeenCalledWith(
      ICO_INSTRUCTIONS_PART_TYPEID,
      undefined,
    );
  });

  it('should handle settings load failure', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { component } = await setup({
      settings: Promise.reject(new Error('no settings')),
    });
    await waitFor(() => expect(warn).toHaveBeenCalled());
    expect(component.lookupProviderOptions()).toBeUndefined();
    warn.mockRestore();
  });
  //#endregion

  //#region List
  it('should render instructions with looked-up labels', async () => {
    const thesauri = buildThesauri([
      'ico-instruction-types',
      'ico-instruction-type-tags',
      'ico-instruction-positions',
    ]);
    await setup({
      thesauri,
      part: buildPart([
        instr('12r', {
          types: [
            {
              value: 'ico-instruction-types.a',
              tag: 'ico-instruction-type-tags.b',
            },
          ],
          position: 'ico-instruction-positions.b',
        }),
      ]),
    });
    expect(screen.getByText(/ICO-INSTRUCTION-TYPES A/)).toBeTruthy();
    expect(screen.getByText(/ICO-INSTRUCTION-TYPE-TAGS B/)).toBeTruthy();
    expect(screen.getByText('12r')).toBeTruthy();
    expect(screen.getByText('ICO-INSTRUCTION-POSITIONS B')).toBeTruthy();
  });

  it('should render raw values without thesauri', async () => {
    await setup({
      part: buildPart([instr('12r', { types: [{ value: 'tv', tag: 'tt' }] })]),
    });
    expect(screen.getByText(/tv/)).toBeTruthy();
    expect(screen.getByText(/\(\s*tt\s*\)/)).toBeTruthy();
  });

  it('should disable first up and last down buttons', async () => {
    await setup({ part: buildPart([instr('a'), instr('b')]) });
    const up = screen.getAllByRole('button', {
      description: 'Move this instruction up',
    }) as HTMLButtonElement[];
    const down = screen.getAllByRole('button', {
      description: 'Move this instruction down',
    }) as HTMLButtonElement[];
    expect(up[0].disabled).toBe(true);
    expect(up[1].disabled).toBe(false);
    expect(down[0].disabled).toBe(false);
    expect(down[1].disabled).toBe(true);
  });
  //#endregion

  it('should not re-create all rows when data is reloaded (NG0956)', async () => {
    const warn = vi.spyOn(console, 'warn');
    const instructions = [
      instr('a', { types: [{ value: 't1' }, { value: 't2', tag: 'g' }] }),
      instr('b'),
    ];
    const { fixture } = await setup({ part: buildPart(instructions) });
    // reload structurally equal data, as after a save or a reload
    fixture.componentRef.setInput('data', {
      value: buildPart(structuredClone(instructions)),
      thesauri: {},
    });
    fixture.detectChanges();
    await fixture.whenStable();
    const ng0956 = warn.mock.calls.filter((c) =>
      String(c[0]).includes('NG0956'),
    );
    expect(ng0956).toEqual([]);
    expect(screen.getAllByRole('row').length).toBe(3);
    warn.mockRestore();
  });

  it('should update a row in place when its instruction is replaced', async () => {
    const { component, fixture } = await setup({
      part: buildPart([instr('a'), instr('b')]),
    });
    component.editInstruction(component.form.instructions().value()[1], 1);
    component.saveInstruction(instr('B', { types: [{ value: 'tz' }] }));
    await fixture.whenStable();
    const rows = screen.getAllByRole('row');
    expect(rows[2].textContent).toContain('B');
    expect(rows[2].textContent).toContain('tz');
    expect(screen.queryByText('b')).toBeNull();
  });
  //#endregion

  //#region Editing
  it('should open editor for a new instruction', async () => {
    const user = userEvent.setup();
    const thesauri = buildThesauri(Object.keys(THESAURI_INPUTS));
    const { component, getEditor } = await setup({ thesauri });
    expect(getEditor()).toBeUndefined();
    await user.click(screen.getByRole('button', { name: /Instruction/ }));
    expect(component.editedIndex()).toBe(-1);
    expect(component.edited()).toEqual({
      types: [],
      location: '',
      script: '',
      position: '',
    });
    const editor = getEditor()!;
    expect(editor).toBeTruthy();
    expect(editor.instruction()).toEqual(component.edited());
    for (const key of Object.keys(THESAURI_INPUTS)) {
      const signal = editor[THESAURI_INPUTS[key]] as () => unknown;
      expect(signal(), key).toEqual(thesauri[key].entries);
    }
    expect(screen.getByText('instruction #0')).toBeTruthy();
  });

  it('should pass lookup options to editor', async () => {
    const options = { x: 1 } as unknown as LookupProviderOptions;
    const { component, getEditor, fixture } = await setup({
      settings: Promise.resolve({ lookupProviderOptions: options }),
    });
    await waitFor(() =>
      expect(component.lookupProviderOptions()).toBe(options),
    );
    component.addInstruction();
    fixture.detectChanges();
    expect(getEditor()!.lookupProviderOptions()).toBe(options);
  });

  it('should append a new instruction saved from editor', async () => {
    const user = userEvent.setup();
    const { component, getEditor, fixture } = await setup({
      part: buildPart([instr('a')]),
    });
    await user.click(screen.getByRole('button', { name: /Instruction/ }));
    getEditor()!.instruction.set(instr('new'));
    await fixture.whenStable();
    expect(component.form.instructions().value().map((i) => i.location)).toEqual([
      'a',
      'new',
    ]);
    expect(component.form.instructions().dirty()).toBe(true);
    expect(component.edited()).toBeUndefined();
    expect(component.editedIndex()).toBe(-1);
    expect(getEditor()).toBeUndefined();
    expect(screen.getByText('new')).toBeTruthy();
  });

  it('should edit a clone of an existing instruction and replace it', async () => {
    const user = userEvent.setup();
    const { component, getEditor, fixture } = await setup({
      part: buildPart([instr('a'), instr('b')]),
    });
    await user.click(
      screen.getAllByRole('button', {
        description: 'Edit this instruction',
      })[1],
    );
    expect(component.editedIndex()).toBe(1);
    expect(component.edited()).toEqual(instr('b'));
    expect(component.edited()).not.toBe(component.form.instructions().value()[1]);
    expect(screen.getByText('instruction #2')).toBeTruthy();
    expect(screen.getAllByRole('row')[2].classList).toContain('selected');
    getEditor()!.instruction.set(instr('B'));
    await fixture.whenStable();
    expect(component.form.instructions().value().map((i) => i.location)).toEqual([
      'a',
      'B',
    ]);
  });

  it('should close editor on cancel', async () => {
    const { component, getEditor, fixture } = await setup({
      part: buildPart([instr('a')]),
    });
    component.editInstruction(component.form.instructions().value()[0], 0);
    fixture.detectChanges();
    getEditor()!.cancelEdit.emit();
    await fixture.whenStable();
    expect(component.edited()).toBeUndefined();
    expect(component.editedIndex()).toBe(-1);
    expect(getEditor()).toBeUndefined();
    expect(component.form.instructions().value().length).toBe(1);
  });

  it('should delete an instruction upon confirmation', async () => {
    const user = userEvent.setup();
    const { component, dialogService } = await setup({
      part: buildPart([instr('a'), instr('b')]),
    });
    await user.click(
      screen.getAllByRole('button', {
        description: 'Delete this instruction',
      })[0],
    );
    expect(dialogService.confirm).toHaveBeenCalledWith(
      'Confirmation',
      'Delete instruction?',
    );
    expect(component.form.instructions().value().map((i) => i.location)).toEqual([
      'b',
    ]);
    expect(component.form.instructions().dirty()).toBe(true);
  });

  it('should not delete an instruction without confirmation', async () => {
    const { component } = await setup({
      part: buildPart([instr('a')]),
      confirm: false,
    });
    component.deleteInstruction(0);
    expect(component.form.instructions().value().length).toBe(1);
  });

  it('should close editor when deleting the edited instruction', async () => {
    const { component } = await setup({
      part: buildPart([instr('a'), instr('b')]),
    });
    component.editInstruction(component.form.instructions().value()[1], 1);
    component.deleteInstruction(1);
    expect(component.edited()).toBeUndefined();
    expect(component.editedIndex()).toBe(-1);
  });

  it('should keep tracking the edited instruction when deleting a previous one', async () => {
    const { component } = await setup({
      part: buildPart([instr('a'), instr('b'), instr('c')]),
    });
    component.editInstruction(component.form.instructions().value()[2], 2);
    component.deleteInstruction(0);
    expect(component.editedIndex()).toBe(1);
    component.saveInstruction(instr('C'));
    expect(component.form.instructions().value().map((i) => i.location)).toEqual([
      'b',
      'C',
    ]);
  });

  it('should not change edited index when deleting a following one', async () => {
    const { component } = await setup({
      part: buildPart([instr('a'), instr('b'), instr('c')]),
    });
    component.editInstruction(component.form.instructions().value()[0], 0);
    component.deleteInstruction(2);
    expect(component.editedIndex()).toBe(0);
  });

  it('should move instructions via UI', async () => {
    const user = userEvent.setup();
    const { component } = await setup({
      part: buildPart([instr('a'), instr('b')]),
    });
    await user.click(
      screen.getAllByRole('button', {
        description: 'Move this instruction down',
      })[0],
    );
    expect(component.form.instructions().value().map((i) => i.location)).toEqual([
      'b',
      'a',
    ]);
    expect(component.form.instructions().dirty()).toBe(true);
    await user.click(
      screen.getAllByRole('button', {
        description: 'Move this instruction up',
      })[1],
    );
    expect(component.form.instructions().value().map((i) => i.location)).toEqual([
      'a',
      'b',
    ]);
  });

  it('should ignore out of range moves', async () => {
    const { component } = await setup({
      part: buildPart([instr('a'), instr('b')]),
    });
    component.moveInstructionUp(0);
    component.moveInstructionDown(1);
    expect(component.form.instructions().value().map((i) => i.location)).toEqual([
      'a',
      'b',
    ]);
    expect(component.form.instructions().dirty()).toBe(false);
  });

  it('should keep tracking the edited instruction when moving', async () => {
    const { component } = await setup({
      part: buildPart([instr('a'), instr('b'), instr('c')]),
    });
    component.editInstruction(component.form.instructions().value()[0], 0);
    // [a,b,c] -> [b,a,c]
    component.moveInstructionDown(0);
    expect(component.editedIndex()).toBe(1);
    // [b,a,c] -> [b,c,a]
    component.moveInstructionUp(2);
    expect(component.editedIndex()).toBe(2);
    // moving unrelated items: [b,c,a] -> [c,b,a]
    component.moveInstructionDown(0);
    expect(component.editedIndex()).toBe(2);
    component.saveInstruction(instr('A'));
    expect(component.form.instructions().value().map((i) => i.location)).toEqual([
      'c',
      'b',
      'A',
    ]);
  });
  //#endregion

  //#region Save and close
  it('should save part via save button', async () => {
    const user = userEvent.setup();
    const part = buildPart([instr('a')]);
    const { component, dataChange, fixture } = await setup({ part });
    component.moveInstructionDown(0); // no-op
    component.saveInstruction(instr('b'));
    await fixture.whenStable();
    await user.click(screen.getByRole('button', { name: /save/ }));
    expect(dataChange).toHaveBeenCalledTimes(1);
    const saved = dataChange.mock.calls[0][0] as EditedObject<IcoInstructionsPart>;
    expect(saved.value!.id).toBe('p1');
    expect(saved.value!.instructions.map((i) => i.location)).toEqual([
      'a',
      'b',
    ]);
    expect(component.form().dirty()).toBe(false);
  });

  it('should build a new part when data has no value', async () => {
    const { component, dataChange } = await setup({ part: null });
    component.saveInstruction(instr('a'));
    component.save();
    const saved = dataChange.mock.calls[0][0] as EditedObject<IcoInstructionsPart>;
    expect(saved.value!.itemId).toBe('item1');
    expect(saved.value!.typeId).toBe(ICO_INSTRUCTIONS_PART_TYPEID);
    expect(saved.value!.roleId).toBe('r1');
    expect(saved.value!.instructions.length).toBe(1);
  });

  it('should not save an empty part', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { component, dataChange } = await setup();
    component.save();
    expect(dataChange).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('should emit dirtyChange when instructions change', async () => {
    const { component, dirtyChange, fixture } = await setup({
      part: buildPart([instr('a')]),
    });
    component.saveInstruction(instr('b'));
    // emitted by an effect
    await fixture.whenStable();
    expect(dirtyChange).toHaveBeenLastCalledWith(true);
  });

  it('should emit editorClose on close', async () => {
    const user = userEvent.setup();
    const { editorClose } = await setup();
    await user.click(screen.getByRole('button', { name: /close/ }));
    expect(editorClose).toHaveBeenCalledTimes(1);
  });

  it('should hide save button for users below operator level', async () => {
    await setup({ roles: ['visitor'] });
    expect(screen.queryByRole('button', { name: /save/ })).toBeNull();
    expect(screen.getByRole('button', { name: /close/ })).toBeTruthy();
  });

  it('should show save button for operators', async () => {
    await setup({ roles: ['operator'] });
    expect(screen.getByRole('button', { name: /save/ })).toBeTruthy();
  });
  //#endregion

  //#region Signal forms behavior
  it('should stay pristine after binding data', async () => {
    const { component, dirtyChange } = await setup({
      part: buildPart([instr('a')]),
    });
    expect(component.form().dirty()).toBe(false);
    expect(dirtyChange).not.toHaveBeenCalledWith(true);
  });

  it('should clear the dirty state when new data is bound', async () => {
    const { component, fixture, dirtyChange } = await setup({
      part: buildPart([instr('a')]),
    });
    component.saveInstruction(instr('b'));
    await fixture.whenStable();
    expect(component.form().dirty()).toBe(true);
    expect(dirtyChange).toHaveBeenLastCalledWith(true);
    fixture.componentRef.setInput('data', {
      value: buildPart([instr('c')]),
      thesauri: {},
    });
    await fixture.whenStable();
    expect(component.form().dirty()).toBe(false);
    expect(dirtyChange).toHaveBeenLastCalledWith(false);
    expect(
      component.form.instructions().value().map((i) => i.location),
    ).toEqual(['c']);
  });

  it('should save a part with no form tags', async () => {
    const { component, dataChange } = await setup({
      part: buildPart([instr('a'), instr('b')]),
    });
    // walk the instructions, so that the form tags them
    for (const item of component.form.instructions as unknown as Iterable<
      () => unknown
    >) {
      item();
    }
    component.moveInstructionDown(0);
    component.save();
    const saved = dataChange.mock.calls[0][0] as EditedObject<IcoInstructionsPart>;
    expect(saved.value!.instructions.map((i) => i.location)).toEqual([
      'b',
      'a',
    ]);
    expect(hasSymbols(saved.value)).toBe(false);
  });

  it('should not tag the instructions of the bound part', async () => {
    const part = buildPart([instr('a')]);
    const { component } = await setup({ part });
    for (const item of component.form.instructions as unknown as Iterable<
      () => unknown
    >) {
      item();
    }
    expect(hasSymbols(part.instructions)).toBe(false);
  });

  it('should render no form element', async () => {
    const { container } = await setup({ part: buildPart([instr('a')]) });
    expect(container.querySelector('form')).toBeNull();
  });

  it('should disable the whole form when disabled', async () => {
    const { component, fixture } = await setup({
      part: buildPart([instr('a')]),
    });
    fixture.componentRef.setInput('disabled', true);
    await fixture.whenStable();
    expect(component.form().disabled()).toBe(true);
  });
  //#endregion
});
