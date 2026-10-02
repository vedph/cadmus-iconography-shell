# Changelog

## 1.0.1

- 2026-10-02: ⚠️ migrated tests from Karma/Jasmine to Vitest, using the Angular `@angular/build:unit-test` builder:
  - removed `karma`, `karma-chrome-launcher`, `karma-coverage`, `karma-jasmine`, `karma-jasmine-html-reporter`, `jasmine-core`, `@types/jasmine` and `istanbul-lib-instrument`.
  - added `vitest` (already present), `jsdom`, `@vitest/coverage-v8`, `@testing-library/angular`, `@testing-library/dom` and `@testing-library/user-event`.
  - library test targets now use `@angular/build:unit-test` with the `vitest` runner. They use the shell app's `development` build target, whose polyfills do not include `zone.js`, so tests run zoneless like the app.
  - `pnpm-workspace.yaml` stops hoisting `zone.js`. It is an optional peer of `@angular/core` that pnpm installs anyway, and when it is hoisted the test builder picks it up and tries to load `zone.js/testing` for library projects.
  - the demo app in `src/app` is excluded from tests: its stub specs, `tsconfig.spec.json`, its `test` target and its `testing` build configuration were removed.
  - new scripts: `pnpm test` (all libraries), `pnpm run test-ins`, `pnpm run test-pg`, `pnpm run test-coverage`.
- added full tests for all components in `@myrmidon/cadmus-part-iconography-instructions` (Angular Testing Library) and for the model schema and `@myrmidon/cadmus-part-iconography-pg` routes (plain Vitest): 136 tests in total. Third-party child components (asserted IDs, assertion, historical date, thesaurus tree, flag set) are replaced in tests by stubs with the same selectors, inputs and outputs, so that template bindings are still verified.

Bug fixes (`@myrmidon/cadmus-part-iconography-instructions`):

1. **Nested form submits bubbled up to the parent forms** (`IcoInstructionEditorComponent`, `IcoInstructionDiffEditorComponent`, `IcoColorReuseEditorComponent`). Angular renders nested `<form>` elements, and the DOM `submit` event bubbles, so a submit in an inner form also reached every outer form's `(submit)` handler:
   - adding a type (button or Enter in the type field) also ran the instruction editor's `save()`. When the instruction was valid, it was emitted and the editor closed while the user was still editing it. It also reset the dirty state.
   - accepting a diff or a color reuse did the same.
   - accepting an instruction, or pressing Enter in any instruction field, also submitted the part form, which saved the whole part to the backend. This happened even when the instruction itself was invalid and was not accepted.

   Fix: the nested forms now stop propagation of their `submit` event (`(submit)="save(); $event.stopPropagation()"`, and the same for `addType()`).
   ⚠️ Behavior change: accepting an instruction no longer saves the part automatically. The part becomes dirty, and you save it with its Save button, as for any other part. The pending changes guard still warns before leaving with unsaved changes.
2. **The edited item lost track of its position** (`IcoInstructionsPartComponent` for instructions, `IcoInstructionEditorComponent` for diffs and color reuses). While an item was open in its editor, deleting an item before it, or moving it or a neighbor, left the stored edited index unchanged. Saving the editor then overwrote a different item, losing data. Example: while editing instruction #3, delete instruction #1, then accept: instruction #3 (formerly #4) was overwritten, or nothing was replaced if it was the last one. Fix: the edited index is now adjusted on delete and move.
3. **Validation messages for too-long values never appeared** in any editor. Templates checked `errors?.maxLength`, but Angular's `Validators.maxLength` reports the error under the `maxlength` key (all lowercase). All templates now use `maxlength`.
4. **Sequences were parsed incorrectly** (`IcoInstructionEditorComponent`). The space-delimited `sequences` text was split on single spaces only:
   - clearing the field, which leaves an empty string, saved `sequences: [""]` instead of no sequences.
   - more than one space, or a newline (the field is a textarea), produced empty or merged entries. For example, `"a  b\nc"` gave `["a", "", "b\nc"]`.

   Sequences are now split on any whitespace, and empty entries are dropped.
5. **Unhandled promise rejection when editor settings could not be loaded** (`IcoInstructionsPartComponent`). The `getSettingFor` promise had no `catch`. The failure is now logged as a warning, and lookup options are reset to undefined.
6. **The diff type was not trimmed** (`IcoInstructionDiffEditorComponent`). When typed as free text, the type was saved with leading and trailing spaces. The target, the note and the color reuse fields were already trimmed. It is now trimmed too.
7. **NG0956 warnings from `@for` loops** (`IcoInstructionsPartComponent`, `IcoInstructionEditorComponent`). Five loops tracked plain data objects by identity: the instructions list, the types in each instruction row, and the types, diffs and color reuses lists in the instruction editor. Whenever the list got structurally equal copies (data reload after a save, form reset, a new instruction set into the editor), every item had a new identity. So the whole collection was destroyed and re-created, and Angular warned NG0956. These items have no unique key and their rows hold no state, so the loops now use `track $index`, which reuses the rows and only updates their bindings. Loops over thesaurus entries already tracked by `e.id`, which is unique, and are unchanged.

## 1.0.0

- 2026-03-13: ⚠️ migrated to Angular 22 and new [Monaco wrapper](https://vedph.github.io/cadmus-doc/history/20260613-monaco.html).

## 0.1.2

- 2026-03-18: migrated shell app to M3 themes and added dark theme support to components.

## 0.1.1

- 2026-03-17:
  - ⚠️ migrated shell app to zoneless.
  - minor fixes to instructions part.

## 0.1.0

- 2026-03-01:
  - updated Angular and packages.
  - ⚠️ migrated to `OnPush`.

## 0.0.4

- 2026-02-05:
  - updated Angular and packages.
  - added `lookupProviderOptions` wherever lookup components are used, getting data from settings and changing the corresponding part thesauri to be role-dependent.

## 0.0.3

- 2026-01-18:
  - updated packages adding `@myrmidon/cadmus-thesaurus-store`.
  - added `asserted-id-features` thesaurus to instructions part.
- 2025-11-24:
  - ⚠️ upgraded to Angular 21.
  - migrated to `pnpm`.

## 0.0.1

- 2025-10-06:
  - added optional hierarchical thesaurus to subjects.
  - minor fixes.
- 2025-10-05: fixes.
- 2025-10-02: completed iconography instructions part.
- 2025-09-27:
  - updated packages.
  - added pg library.
- 2025-09-25: updated Angular and packages.
- 2025-09-19:
  - updated Angular and packages.
  - refactored for full reactivity.
