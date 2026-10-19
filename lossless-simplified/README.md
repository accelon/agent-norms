# lossless-simplified

Reusable **lossless Traditional → Simplified** display conversion for Chinese text.

The goal: let readers who prefer Simplified Chinese read comfortably **without losing meaning** when several Traditional characters collapse into one Simplified character.

```ts
import { toSimplified, displayConverter, type SimMode } from './lossless';

toSimplified('頭髮乾燥，臺灣的醫生後來又發心。', 1);
// 頭髮乾燥，臺灣的醫生後來又發心。   ← lossless: ambiguous merges stay Traditional

toSimplified('頭髮乾燥，臺灣的醫生後來又發心。', 2);
// 头发干燥，台湾的医生后来又发心。   ← force: everything converts
```

## Modes

| Mode | Value | Behavior |
|---|---|---|
| Original | `0` | No conversion |
| Lossless | `1` | Only one-to-one Traditional→Simplified; multi-to-one merges preserved |
| Force | `2` | All `kSimplifiedVariant` conversions, including merges |

`SimMode` is `0 | 1 | 2`.

## API

```ts
simplifyChar(ch: string, mode: SimMode): string
toSimplified(text: string, mode: SimMode): string
losslessConverts(ch: string): boolean       // diagnostic
simplifiedStats(): { safe: number; force: number }
displayConverter(mode: SimMode): ((s: string) => string) | null
```

- Conversion is **per code point**; it does not touch punctuation, digits, or Latin letters.
- `displayConverter(0)` returns `null`, so callers can skip a full string scan.

## Lossless rules

1. The Simplified target must not itself be a common Traditional character. A hand-maintained set (`LOSSY_TARGETS`: 后、台、里、干、只、几、云、面、松、咸、借、谷、舍、系、复、于、郁、冲、准、胡、采、累、布、卷、秋、千、卜、出、板、表、别、蒙、划、夸、困、厘、了、霉、仆、曲、术、涂、向、须、折、征、志、制、朱、筑、姜、御、芸、沾、毡) excludes those conversions. Otherwise 「王后／王後」 would collapse.
2. The Traditional character must map to exactly one Simplified character.
3. The Simplified target's other Traditional forms must all be **variants of the same character** (Unihan `kZVariant` / `kSemanticVariant` / `kSpecializedSemanticVariant`, union-find).
   - May convert: 說／説→说, 眾／衆→众.
   - Must not convert: 發／髮→发, 乾／幹→干.
4. The Traditional character itself must be in that variant group; otherwise two different characters would be merged.

The generated table stores two chars per pair, so it only includes BMP characters. Non-BMP Han characters are left as-is.

## Data generation

```powershell
cd lossless-simplified

# needs ../vendor/Unihan_Variants.txt (not committed)
bun run gen-lossless.ts
bun run gen-lossless.ts --check

# custom locations
bun run gen-lossless.ts --src path/to/Unihan_Variants.txt --out path/to/simplified-data.ts
bun run gen-lossless.ts --check --src ... --out ...
```

- `simplified-data.ts` is generated and committed; consumers do not need the vendor file to build.
- The generator reads `kSimplifiedVariant`, `kTraditionalVariant`, `kZVariant`, `kSemanticVariant`, `kSpecializedSemanticVariant`.
- Current output: 2641 lossless pairs / 2810 force pairs.
- Do not hand-edit `simplified-data.ts`; rerun the generator.
- Windows console may show Chinese as mojibake; that does not affect the UTF-8 output file. Run `chcp 65001` first if you want readable console logs.

## Test

```powershell
bun run test.ts
```

The test covers:

- one-to-one conversions (`見→见`, `潛→潜`)
- ambiguous merges preserved in lossless mode (`髮`, `乾`, `臺`, `後`)
- force mode converts them
- punctuation/digits/Latin untouched
- stats and `losslessConverts`

## Integration rules

- **Display only.** Index, search, highlight offsets, sorting and clipboard/export should stay on the original text.
- If you highlight text after display conversion, convert the highlight target with the same mode; otherwise offsets/characters will not match.
- Do not write converted text back into an index, cache, or saved file.
- If the UI shows a converted string and the user copies it, decide explicitly whether copy returns the original or the displayed form; default to original.

## Files

```text
lossless.ts          runtime conversion, no dependencies
simplified-data.ts   generated SAFE_PAIRS / FORCE_PAIRS
gen-lossless.ts      Unihan → simplified-data.ts generator
test.ts              dependency-free assertions
```

## Attribution

- Unihan data: <https://www.unicode.org/reports/tr38/>
- Idea inspired by `ptk/lossless-simplified-chinese`; data is computed from Unihan.
