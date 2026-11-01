# agent-norms

Reusable norms and modules for Yap's local tools.

> **Canonical source**: this repository. Consumers keep a **vendored copy** so their build/CI does not depend on a sibling directory; run the consumer's sync check before release.

## Contents

| Path | What it is |
|---|---|
| [`yap-software-practice.md`](yap-software-practice.md) | Windows / Bun / single-file HTML / Wails3 defaults; Windows UTF-8 & Chinese pitfalls; UI themes; lossless Simplified Chinese |
| [`wails3-pitfalls.md`](wails3-pitfalls.md) | Wails3-specific pitfalls: syso, WebView2, SmartScreen, windows/DPI, updater |
| [`lossless-simplified/`](lossless-simplified/) | Reusable TypeScript module for **lossless Traditional → Simplified display conversion** |
| [`self-explaining-tour/`](self-explaining-tour/) | Dependency-free guided tours: `.tour` DSL, compiler, spotlight player, shell, example |
| [`skills/self-explaining-tour/`](skills/self-explaining-tour/SKILL.md) | Agent skill: when/how to add a self-explaining tour to a new app |
| [`corpus-to-mobile-skills.md`](corpus-to-mobile-skills.md) | Playbook: turn a domain's source corpus into **five WeChat long images** (three-layer architecture, cost/token model, technical advantages) |
| [`corpus-to-mobile/`](corpus-to-mobile/) | Reusable CSS, page-05 template, glyph image, and trim script for the five-image series |
| [`tcm/`](tcm/) | Finished TCM example: five-image series, A4 one-pager, long scroll, token model, HTML sources |
| [`buddhist-study/`](buddhist-study/) | Five-image Buddhist knowledge-base series (01–05), with cost-structure pie, title “人機圓夢”, and technical advantages |
| [`huayen-study/`](huayen-study/) | Four-page Huayen Dictionary proposal: vertical market application built on the Buddhist knowledge base, with patriarch and contemporary-practitioner tracks |
| [`skills/corpus-to-mobile/`](skills/corpus-to-mobile/SKILL.md) | Agent skill trigger for 「做《X》知識庫」; points at the playbook and guardrails |
| [`scrap-parse-skill/`](scrap-parse-skill/SKILL.md) | Web book → structured data: recon, label-based sectioning, junk-stop list, retry fetch, verification (worked example: moshuyuan.com 金剛經) |
| [`docx-svg-skill.md`](docx-svg-skill.md) | Word 圖表 → SVG → adb：抽圖表（含標題行）、剪掉用不到的 zip 零件、Word 批次轉 PDF、PyMuPDF 轉 SVG（文字保持文字）、打包 resources 與 `<圖 t="圖版">` 的完整做法與症狀對照表 |
| [`multilingual-term.md`](multilingual-term.md) | 漢語—外語術語抽取：`<术 sk="…">漢詞</术>` 的匹配、詞界、停止字、已知限制與驗證（ys y2adb 實作） |
| [`writing-skill.md`](writing-skill.md) | 文風指南：從 1995–2025 的論文與講稿抽出的寫作規範——三種語域、長句節奏、詞表與禁用詞、比喻庫、四種骨架、交付檢查清單 |

## How consumers use it

### Docs

- Read them here, or keep a copy in the consumer repo for offline/GitHub links.
- The canonical text lives here; do not fork it in a consumer without recording why.

### `lossless-simplified`

Copy the folder into the consumer's source tree, or vendor just:

```text
lossless.ts
simplified-data.ts
```

Then:

```ts
import { toSimplified, displayConverter, type SimMode } from './lossless';
```

- **No npm dependencies.**
- `simplified-data.ts` is generated and committed, so a build does not need `Unihan_Variants.txt`.
- To regenerate, see [`lossless-simplified/README.md`](lossless-simplified/README.md).

### `self-explaining-tour`

A guided tour system for users who do not read manuals, and a repeatable demo script.

- [`self-explaining-tour/README.md`](self-explaining-tour/README.md) — API, DSL, integration, tests.
- [`skills/self-explaining-tour/SKILL.md`](skills/self-explaining-tour/SKILL.md) — the agent workflow (read this first when adding a tour).
- Copy the folder into the app; paste `shell.html`/`shell.css`; implement `TourApp`; write `tour.config.ts` + `tours/*.tour`; run the compiler with `--check`.
- No npm dependencies. The tour data is compiled to base64 and embedded, so single-file/`file://` builds still work.

### `corpus-to-mobile`

A playbook for **「做《X》知識庫」→ 五張 1080 寬微信長圖**.

- Read [`corpus-to-mobile-skills.md`](corpus-to-mobile-skills.md) first; it has the five-page copy templates, the cost/token model, and the acceptance checklist.
- Copy `corpus-to-mobile/series.css`, `05-tech.html`, `zhaocaijinbao.png`, and `trim_one.py` into the project's `build/series/`.
- Write `01.html`–`05.html` (01–04 are domain-specific; 05 is the technical moat and mostly unchanged), render with Edge headless at 1080 px, then trim/JPEG with Pillow.
- Output names: `{{領域}}知識庫-01-三層架構.jpg` … `-05-技術優勢.jpg`.
- Four-page request: write 01–04 only, set footers `/ 04`, and leave 05 for reuse.
- Finished example: [`tcm/`](tcm/) — five images, A4 one-pager, long scroll, token model, and the HTML sources.

### `adb-converter` sync

`adb-converter` keeps vendored copies at:

```text
yap-software-practice.md
wails3-pitfalls.md
ts/src/accelon26/lossless.ts
ts/src/accelon26/simplified-data.ts
ts/tools/gen-lossless.ts
```

`gen-lossless.ts` is the same generator with the project's default output path; the sync script rewrites those two path/CLI lines.

Run from `adb-converter/ts`:

```powershell
bun run sync:norms          # copy canonical files into the repo
bun run check:norms         # fail if the vendored copy drifted
```

Do not edit the vendored copies directly; edit here and sync.

## Lossless Simplified Chinese — quick rules

- Three modes: `0` original, `1` lossless, `2` force.
- Lossless only converts **one-to-one** Traditional→Simplified.
- Multi-to-one merges are **preserved** (發／髮→发, 乾／幹→干, 臺／台, 後／后, 裡／裏→里).
- A simplified target that is also a common Traditional character is never converted in lossless mode (`LOSSY_TARGETS`).
- Variant groups (說／説, 眾／衆, 為／爲) count as the same character and may convert.
- Display only: indexing/search/highlighting stay on the original text.
- Data is generated from Unihan `kSimplifiedVariant` / `kTraditionalVariant` + variant fields; BMP only because the generated table stores two chars per pair.

## Attribution

- Unihan data: <https://www.unicode.org/reports/tr38/>
- The lossless idea is inspired by `ptk/lossless-simplified-chinese`; the data here is computed from Unihan, not copied from that project.
- Generated data: 2641 lossless pairs / 2810 force pairs (verify with `--check`).

## Remote

<https://github.com/accelon/agent-norms>
