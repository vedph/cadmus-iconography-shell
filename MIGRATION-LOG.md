# Signal forms migration log

Migration of the workspace libraries from reactive forms to Angular signal forms, after upgrading the `@myrmidon/cadmus-*` core packages to v20.

Every statement here was measured unless it is marked **believed**. A believed statement says how it could be checked.

## Workspace

- Added `scripts/build-libs.mjs` (copied from `cadmus-shell-v3`): `pnpm build:libs [lib...]` builds the given libraries and everything downstream of them, in dependency order. Order: `cadmus-part-iconography-instructions` → `cadmus-part-iconography-pg`.
- Added `scripts/check-local-libs.js` (`pnpm check-libs`): it fails if a local library exists in `node_modules/@myrmidon` as anything other than a symlink to its `dist/` build. It runs before `build:libs`, `start` and `build`. The `cadmus-shell-v3` original used `JSON.parse` on `tsconfig.json`, which has comments here, so this copy parses it with TypeScript's `readConfigFile`.
  - Verified: it passes on the current tree. It exits 1 when a real `node_modules/@myrmidon/cadmus-part-iconography-pg` directory exists.
- Library resolution: both local libraries resolve only through `tsconfig.json` `paths` to `./dist/myrmidon/<lib>`. Neither is present in `node_modules`.

## `@myrmidon/cadmus-part-iconography-instructions`

### Components

| Component | Kind | Notes |
| --- | --- | --- |
| `IcoInstructionsPartComponent` | part editor (`ModelEditorComponentBase`) | `linkedSignal` draft + `createForm`. Thesauri are `computed()`. Settings are loaded through `initSettings`. No `<form>`. Saves through `(saveRequest)`. |
| `IcoInstructionEditorComponent` | manual-save sub-editor | Canonical template: `linkedSignal` with the `previous` echo check, plus a reset effect keyed on the draft and guarded by `isDraftInSync()`. The new-type form is a separate signal form (`typeForm`). |
| `IcoInstructionDiffEditorComponent` | manual-save sub-editor | Canonical template. |
| `IcoColorReuseEditorComponent` | manual-save sub-editor | Canonical template. |
| `IcoInstructionsPartFeatureComponent` | page wrapper | Unchanged. `EditPartFeatureBase` keeps its v20 constructor signature. |

None of these components autosaves. They are not the "linkedSignal does not fit" case.

### Behaviour decisions

- **Enter key.** The sub-editors render no `<form>`. A root `(keydown.enter)` handler with `isImplicitSubmission` keeps Enter-to-save, and it only saves where the Accept button would be enabled (valid and dirty). In the old code, implicit submission was blocked whenever the default button was disabled. The new-type inputs use their own `(keydown.enter)`, which adds the type and never saves the instruction.
- **Enter in a child's own form.** `cadmus-thesaurus-tree` contains `cadmus-thesaurus-browser`, which still renders `<form [formRoot]>` for its finder. A root keydown handler sees that Enter too, because the keydown is not `defaultPrevented`. `IcoInstructionEditorComponent.onEnterKey` therefore ignores targets whose `.form` is set. Pinned by the spec "should not save on Enter in a child form input".
  - Verified by mutation: without the guard, that spec fails.
  - Not checked in the browser: the seeded database has no `ico-instruction-subjects` thesaurus, so the tree never rendered.
- **Child echoes.** The handlers for the autosaving children (historical date, assertion, asserted composite IDs, flag sets) use `setFieldFromChild`.
  - Verified by mutation: with the old "set and always mark dirty" handler, the spec "should stay pristine when children echo their normalized values" fails.
  - Measured: a child echo that is JSON-identical to the bound value (e.g. an added `undefined` property) is also absorbed by the draft-keyed reset effect. That is why the spec emits `null`s, which the real children produce.
- **Symbol tags.** Arrays of objects are copied with `copyFormValue` on the way in and out.
  - Measured: field-tree items carry an extra Symbol property even when the template never iterates the field tree, so the specs compare form values through a JSON round trip.
  - Measured: the emitted instruction and the saved part carry no Symbols (specs), and the bound input objects are not tagged (specs).
- **Validator.** `NgxToolsValidators.strictMinLengthValidator(1)` became `NgxToolsSignalValidators.strictMinLength`, on `instructions` (part) and `types` (instruction). The old `types` used `Validators.required`, which on an array fails for an empty array, so the behaviour is the same.
- **`dirtyChange` timing.** v20's base class emits `dirtyChange` from an effect, so it now arrives after change detection instead of synchronously. Two specs now `await fixture.whenStable()` before asserting it.

### Behaviour changes (intentional)

- The instruction editor now trims its strings on save (e.g. `"e-1 "` → `"e-1"`, verified in Chrome), following the CHANGELOG checklist. Before, it saved them untrimmed. The diff and color reuse editors already trimmed.
- Removed four error messages that could never appear: "type tag required" ×2 (the tag was never required), "script too long" and "sequences too long" (these fields have no max length).

### Verification

- `ng test @myrmidon/cadmus-part-iconography-instructions`: 6 files, 163 tests green (138 before the migration, none dropped). There was no stderr or `NG0` output.
- `ng build` of both libraries via `build:libs`: clean. `ng test @myrmidon/cadmus-part-iconography-pg`: 2/2 green.
- The demo app builds (`ng build --configuration development`).
- Browser (headless Chrome over CDP, `.angular/cache` deleted first, local API at `:5062`, seeded item `d24acf52…`, part `6befbf78…`):
  - The served chunk contains `onTypeEnterKey`. No chunk contains the old `instructionsList`, so the browser ran the new code.
  - The part opened pristine (`canDeactivate: true`). Its instruction, full of `null`s, opened with the real child widgets and stayed pristine after 2.5 s idle, with Accept disabled.
  - Enter in a textarea: newline only, no save.
  - Nested diff editor: Enter in its input saved the diff only. The instruction editor stayed open.
  - Enter in EID saved the instruction and closed it. The part became dirty.
  - Edit plus Enter inside the nested assertion widget on a pristine instruction: no save. After the child's debounce, the instruction became dirty with the new assertion.
  - The part was never saved, so no data was written.

## Findings outside the migration's scope (not fixed)

- **Enter in a bricks child input saves a dirty instruction before the child has emitted.** Measured in Chrome: with the instruction already dirty, Enter in the assertion "note" input saved and closed the instruction. The assertion's debounced emit then hit a destroyed output (`NG0953`), and the text typed into the assertion was lost.
  - **Believed** pre-existing: the bricks children render no `<form>`, so their inputs belonged to the old instruction `<form>`, and implicit submission went through its enabled Accept button. HEAD cannot be built against the v20 packages to confirm this. It could be checked against a pre-upgrade checkout.
  - One fix would be to restrict Enter-to-save to the editor's own inputs.
- `@myrmidon/cadmus-state` (external) logs `part dirty change (from editor)` to the console.
