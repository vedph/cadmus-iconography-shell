import { Component, input, model, output } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { render } from '@testing-library/angular';
import { BehaviorSubject } from 'rxjs';

import { ItemService, ThesaurusService } from '@myrmidon/cadmus-api';
import {
  EditedObject,
  Part,
  PartIdentity,
  ThesauriSet,
} from '@myrmidon/cadmus-core';
import { PartEditorService } from '@myrmidon/cadmus-state';

import {
  ICO_INSTRUCTIONS_PART_TYPEID,
  IcoInstructionsPart,
} from '../ico-instructions-part';
import { IcoInstructionsPartFeatureComponent } from './ico-instructions-part-feature.component';

@Component({ selector: 'cadmus-current-item-bar', template: '' })
class CurrentItemBarStubComponent {}

@Component({ selector: 'cadmus-ico-instructions-part', template: '' })
class PartEditorStubComponent {
  public readonly identity = input<PartIdentity>();
  public readonly data = model<EditedObject<IcoInstructionsPart>>();
  public readonly editorClose = output();
  public readonly dirtyChange = output<boolean>();
}

const THESAURI_IDS = [
  'ico-instruction-types',
  'ico-instruction-type-tags',
  'ico-instruction-subjects',
  'ico-instruction-scripts',
  'ico-instruction-diff-types',
  'ico-instruction-positions',
  'ico-instruction-feats',
  'ico-instruction-languages',
  'ico-instruction-tools',
  'ico-instruction-colors',
  'assertion-tags',
  'doc-reference-types',
  'doc-reference-tags',
  'asserted-id-scopes',
  'asserted-id-tags',
  'asserted-id-features',
];

function buildPart(): IcoInstructionsPart {
  return {
    id: 'p1',
    itemId: 'item1',
    typeId: ICO_INSTRUCTIONS_PART_TYPEID,
    timeCreated: new Date(),
    creatorId: 'zeus',
    timeModified: new Date(),
    userId: 'zeus',
    instructions: [],
  };
}

interface SetupOptions {
  pid?: string;
  rid?: string;
  loaded?: EditedObject<Part> | null;
  loadError?: Error;
  saveError?: Error;
}

async function setup(options: SetupOptions = {}) {
  const route = {
    snapshot: {
      params: { iid: 'item1', pid: options.pid ?? 'p1' },
      queryParams: options.rid !== undefined ? { rid: options.rid } : {},
      routeConfig: { path: `${ICO_INSTRUCTIONS_PART_TYPEID}/:pid` },
    },
  };
  const router = { navigate: vi.fn().mockResolvedValue(true) };
  const snackbar = { open: vi.fn() };
  const editorService = {
    loading$: new BehaviorSubject(false),
    saving$: new BehaviorSubject(false),
    load: vi.fn(() =>
      options.loadError
        ? Promise.reject(options.loadError)
        : Promise.resolve(options.loaded === undefined ? null : options.loaded),
    ),
    save: vi.fn((part: Part) =>
      options.saveError
        ? Promise.reject(options.saveError)
        : Promise.resolve({ ...part, id: part.id || 'new-id' }),
    ),
  };
  const log = vi.spyOn(console, 'log').mockImplementation(() => {});

  const result = await render(IcoInstructionsPartFeatureComponent, {
    providers: [
      { provide: ActivatedRoute, useValue: route },
      { provide: Router, useValue: router },
      { provide: MatSnackBar, useValue: snackbar },
      { provide: ItemService, useValue: {} },
      { provide: ThesaurusService, useValue: {} },
      { provide: PartEditorService, useValue: editorService },
    ],
    componentImports: [CurrentItemBarStubComponent, PartEditorStubComponent],
  });
  await result.fixture.whenStable();
  const component = result.fixture.componentInstance;
  const getEditor = () =>
    result.fixture.debugElement.query(
      (e) =>
        e.nativeElement?.tagName?.toLowerCase() ===
        'cadmus-ico-instructions-part',
    ).componentInstance as PartEditorStubComponent;

  return {
    ...result,
    component,
    router,
    snackbar,
    editorService,
    getEditor,
    log,
  };
}

describe('IcoInstructionsPartFeatureComponent', () => {
  afterEach(() => vi.restoreAllMocks());

  it('should create and render the item bar and part editor', async () => {
    const { component, container } = await setup();
    expect(component).toBeTruthy();
    expect(container.querySelector('cadmus-current-item-bar')).toBeTruthy();
    expect(
      container.querySelector('cadmus-ico-instructions-part'),
    ).toBeTruthy();
  });

  it('should build identity from route', async () => {
    const { component, getEditor } = await setup({ rid: 'r1' });
    const identity = {
      itemId: 'item1',
      typeId: ICO_INSTRUCTIONS_PART_TYPEID,
      partId: 'p1',
      roleId: 'r1',
    };
    expect(component.identity()).toEqual(identity);
    expect(getEditor().identity()).toEqual(identity);
  });

  it('should map new part and default role to null', async () => {
    const { component } = await setup({ pid: 'new', rid: 'default' });
    expect(component.identity().partId).toBeNull();
    expect(component.identity().roleId).toBeNull();
  });

  it('should load data with all requested thesauri', async () => {
    const { editorService } = await setup();
    expect(editorService.load).toHaveBeenCalledWith(
      expect.objectContaining({ itemId: 'item1', partId: 'p1' }),
      THESAURI_IDS,
    );
  });

  it('should suffix thesauri IDs with role and alias them back', async () => {
    const thesauri: ThesauriSet = {};
    for (const id of THESAURI_IDS) {
      thesauri[`${id}_r1`] = { id: `${id}_r1@en`, language: 'en', entries: [] };
    }
    const loaded: EditedObject<Part> = { value: buildPart(), thesauri };
    const { editorService, component } = await setup({ rid: 'r1', loaded });
    expect(editorService.load).toHaveBeenCalledWith(
      expect.anything(),
      THESAURI_IDS.map((id) => `${id}_r1`),
    );
    const data = component.data()!;
    for (const id of THESAURI_IDS) {
      expect(data.thesauri[id]).toBe(thesauri[`${id}_r1`]);
    }
  });

  it('should pass loaded data to the part editor', async () => {
    const loaded: EditedObject<Part> = { value: buildPart(), thesauri: {} };
    const { getEditor, fixture } = await setup({ loaded });
    fixture.detectChanges();
    expect(getEditor().data()).toBe(loaded);
  });

  it('should show load errors', async () => {
    const { snackbar } = await setup({ loadError: new Error('load failed') });
    expect(snackbar.open).toHaveBeenCalledWith('load failed', 'OK');
  });

  it('should save part when the editor emits data', async () => {
    const { getEditor, editorService, snackbar, fixture } = await setup();
    const part = buildPart();
    getEditor().data.set({ value: part, thesauri: {} });
    await fixture.whenStable();
    expect(editorService.save).toHaveBeenCalledWith(part);
    expect(snackbar.open).toHaveBeenCalledWith('Part saved', 'OK', {
      duration: 3000,
    });
  });

  it('should update identity after saving a new part', async () => {
    const { component, getEditor, fixture } = await setup({ pid: 'new' });
    getEditor().data.set({ value: { ...buildPart(), id: '' }, thesauri: {} });
    await fixture.whenStable();
    expect(component.identity().partId).toBe('new-id');
  });

  it('should restore dirty state when save fails', async () => {
    const { component, getEditor, snackbar, fixture } = await setup({
      saveError: new Error('save failed'),
    });
    getEditor().data.set({ value: buildPart(), thesauri: {} });
    await fixture.whenStable();
    expect(component.dirty()).toBe(true);
    expect(snackbar.open).toHaveBeenCalledWith('save failed', 'OK');
  });

  it('should navigate to item on editor close', async () => {
    const { getEditor, router } = await setup();
    getEditor().editorClose.emit();
    expect(router.navigate).toHaveBeenCalledWith(['items', 'item1']);
  });

  it('should track dirty state for deactivation', async () => {
    const { getEditor, component } = await setup();
    expect(component.canDeactivate()).toBe(true);
    getEditor().dirtyChange.emit(true);
    expect(component.dirty()).toBe(true);
    expect(component.canDeactivate()).toBe(false);
    getEditor().dirtyChange.emit(false);
    expect(component.canDeactivate()).toBe(true);
  });
});
