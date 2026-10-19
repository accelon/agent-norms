---
name: self-explaining-tour
description: Add a self-explaining guided tour to a web app or webview desktop app (Wails/Tauri/Electron) using the dependency-free .tour DSL, compiler, and spotlight player. Use for first-run onboarding, new-feature discovery, or a repeatable demo script.
---

# Self-explaining tour

Use the [`self-explaining-tour`](../../self-explaining-tour/README.md) module in `agent-norms`.
The goal is software that explains itself: a user who never opens the manual can watch, try, and learn — and the same script can be replayed as a demo.

## When to use

- First-run onboarding: the 3–5 things a new user must know.
- A new major feature: a short "what changed / how to try it" tour.
- A demo script for meetings, screen recordings, or support.
- A guided repair path for a confusing empty/error state.
- Onboarding for a complex panel (settings, filters, import/export).

Do **not** use a tour to replace clear labels, empty states, or inline help. A tour is a layer, not an excuse for a confusing UI.

## Non-negotiables

1. **The tour must be replayable** from a visible entry ("操作導覽" / "Take a tour" / ▶).
2. **Every scene stands alone.** Users can replay one scene or resume mid-tour.
3. **Use `停` for UI explanations, not `等`.** Let the user look; do not auto-run past a panel.
4. **Use `等頁面` for async data, never fixed `等`.** Fixed sleeps are random failures.
5. **Use `你來` for file pickers / OS dialogs.** Browsers block automation.
6. **Close a modal before pointing elsewhere.** Otherwise the spotlight points at a vanished element.
7. **One idea per scene; ~5–12 steps.** If a scene needs a paragraph, split it.
8. **Name what the user sees**, not the function name.
9. **The tour must not leave the user in a changed state.** Restore settings it toggled, or tell them how.
10. **A missing selector must fail at build time.** Configure the template and allow-lists; run `--check` in CI.

## Workflow

### 1. Read the app's UI map

List the 3–7 tasks a new user needs:

- open/import a file;
- search or filter;
- read the main content;
- change a setting;
- find help/updates;
- use the one distinctive feature.

Do not tour every button. Pick the shortest path to "I get it".

### 2. Audit selectors in a real browser

For each step, find a stable selector:

- prefer a stable `#id` on the actual interactive element;
- avoid generated classes, nth-child, or text-only selectors;
- confirm the element is **visible** (not in a closed tab, collapsed panel, or hidden modal);
- for async lists, use `count:` (items mount in batches);
- for app state, expose a small `state()` snapshot and use `api:key`.

Open DevTools and verify:

```js
document.querySelector('#yourTarget')?.getBoundingClientRect()
```

If it is 0×0, the tour will show "⚠ 找不到".

### 3. Add the shell

Copy `shell.html` before `</body>` and `shell.css` into the app's styles.
Keep the ids. If the app is single-file, inline both.

### 4. Implement the adapter

```ts
initTour({
  tab(col, name) { ... },
  side(col, on) { ... },
  set(key, value) { return true/false; },
  call(name, arg) { ... },
  state() { return { ready, tab, query, ... }; },
}, { index: TOUR_INDEX, blobs: TOUR_BLOBS }, {
  appName: 'MyApp',
  modalIds: ['settingsBox', 'aboutBox'],
  storagePrefix: 'myapp.tour',
});
```

Only expose operations the tour genuinely needs. `set` must return `false` for unknown keys so the player can show a useful error.

### 5. Configure the compiler

`tour.config.ts` must declare:

- `tourDir`, `outFile`, `templateFile`;
- `setKeys`, `callNames`, `tabNames`, `apiKeys` — the allow-lists;
- `dynamicIds` for elements created at runtime;
- `formatImport` for the generated file's type import.

Run from the project root. If the config lives elsewhere, pass `--config` and use paths relative to the working directory.

### 6. Write the script

Start with one "welcome" tour. Use the DSL:

```markdown
@id welcome
@title 第一次使用
@intro 一分鐘走一遍。

### 這個畫面
左邊是**目錄**，中間是**內容**。看完點一下畫面。

> 指向 #leftPane
> 停
> 不指向

### 查一個詞
> 指向 #query
> 輸入 #query => 般若
> 等頁面 count:#results .item >= 1 10000
> 指向 #results
> 停 看完再點一下
```

Rules:

- `@id` = filename.
- First `###` starts the first scene.
- `>` lines are commands; everything else is explanation (bold/code/blank lines supported).
- `=>` splits "target => content".

### 7. Compile and check

```powershell
bun run src/tour/build-tours.ts --config tour.config.ts
bun run src/tour/build-tours.ts --config tour.config.ts --check
bun run src/tour/test.ts   # format/compiler checks
```

Put `--check` in CI. A stale `tour-data.ts` is the most common "I fixed the tour but nothing changed" bug.

### 8. Test the whole tour

Use a real browser and `tourState()`:

- every scene reached;
- `failed.length === 0`;
- `spot.overlapTarget === true` for pointed steps;
- bubble does not cover small targets;
- Esc ends; replay works; progress persists;
- settings restored at the end.

A headless full-play test is worth it: the tour is most likely to break silently after a UI refactor.

### 9. Add the entry point

Put "操作導覽 / Take a tour" somewhere discoverable:

- About dialog (recommended for desktop apps);
- Help menu;
- first-run welcome;
- empty state ("不知道從哪開始？看一遍導覽").

Do not hide it in a settings submenu.

### 10. Keep it alive

- When a UI label/selector changes, update the tour in the same commit.
- When a feature is removed, remove its scene.
- Run `--check` and the full-play test before release.
- Add one line to release notes if the tour itself is a user-visible change.

## Demo mode

The same tour is the demo. For a live demo:

- start it from the entry, or call `play(id)` from a console/dev menu;
- use `停` at the impressive moments;
- keep a short "60-second" tour separate from the detailed first-run tour if needed;
- never maintain a second, untested demo script.

## Common failures

| Symptom | Fix |
|---|---|
| `⚠ 找不到` | Selector wrong/invisible; wait for it; close the modal in the right order |
| Tour hangs | Condition never true; inspect `tourState()`; use `count:`/`api:`; add timeout |
| Click does nothing | Element hidden/covered; click the real control |
| File dialog fails | Use `你來` |
| Scene skipped | `若非` is true; check the condition |
| Works in Chrome, fails in webview | Test the real webview; add `modalIds`; selectors differ |
| Stale data | Run the compiler; add `--check` to CI |
| User trapped in a changed state | Restore settings or end with instructions |

## Deliverables checklist

- [ ] `shell.html` + `shell.css` included.
- [ ] `initTour` adapter wired; `state()` exists for `api:` conditions.
- [ ] `tour.config.ts` allow-lists complete.
- [ ] `tours/*.tour` written; `@id` matches filenames.
- [ ] `tour-data.ts` generated; `--check` passes.
- [ ] Entry point visible.
- [ ] Full play test passes with `failed.length === 0`.
- [ ] Settings restored; Esc/replay work.
- [ ] Selectors use stable ids; async steps use `等頁面`.
- [ ] No fixed sleeps for data.
- [ ] `--check` in CI.

## Do not

- Do not invent selectors or assume an element is visible.
- Do not use `等` for data loading.
- Do not automate native file pickers.
- Do not point at a modal's contents after closing it.
- Do not write a 30-scene first-run tour.
- Do not leave the user in advanced/simplified/theme state they did not choose.
- Do not hide the entry point.
- Do not ship without a full-play test.
