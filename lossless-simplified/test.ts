/**
 * Dependency-free assertions for the lossless-simplified module.
 *
 *   bun run test.ts
 */
import { losslessConverts, simplifiedStats, toSimplified } from './lossless';

let failed = 0;

function eq(actual: unknown, expected: unknown, label: string): void {
  if (actual === expected) {
    console.log(`ok  ${label}`);
    return;
  }
  failed++;
  console.error(`NG  ${label}\n    expected: ${JSON.stringify(expected)}\n    actual:   ${JSON.stringify(actual)}`);
}

// one-to-one conversions
eq(toSimplified('見潛', 1), '见潜', 'lossless converts one-to-one');
eq(toSimplified('見潛', 2), '见潜', 'force converts one-to-one');

// multi-to-one merges stay Traditional in lossless mode
// (`灣` is one-to-one and still converts; `髮`/`乾`/`臺`/`後` are the ambiguous ones)
eq(toSimplified('髮乾臺灣後', 1), '髮乾臺湾後', 'lossless preserves ambiguous merges');
eq(toSimplified('髮乾臺灣後', 2), '发干台湾后', 'force converts ambiguous merges');

// variant groups may convert in lossless mode
eq(toSimplified('說衆', 1), '说众', 'lossless converts variant groups');

// non-Han text is untouched
eq(toSimplified('ABC，123。', 1), 'ABC，123。', 'punctuation/digits/Latin untouched');

// original mode is a no-op
eq(toSimplified('髮乾臺灣後', 0), '髮乾臺灣後', 'mode 0 is a no-op');

// diagnostics
eq(losslessConverts('見'), true, 'losslessConverts(見)');
eq(losslessConverts('髮'), false, 'losslessConverts(髮)');

const st = simplifiedStats();
eq(st.safe > 2000, true, `safe pair count looks plausible (${st.safe})`);
eq(st.force >= st.safe, true, `force pair count >= safe (${st.force} >= ${st.safe})`);

if (failed) {
  console.error(`\n${failed} failed`);
  process.exit(1);
}
console.log('\nall lossless-simplified tests passed');
