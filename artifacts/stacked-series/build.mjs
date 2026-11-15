import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const require = createRequire(import.meta.url);
const { build, version: esbuildVersion } = process.env.STACKED_PERF_ESBUILD
    ? require(resolve(process.env.STACKED_PERF_ESBUILD))
    : require('esbuild');
const base = 'fd652e876a2b059924848a2177c82e67d6752327';
const variant = process.argv[2];
if (!['baseline', 'candidate'].includes(variant)) throw new Error('Expected baseline or candidate');
const counters = process.argv.includes('--counters');
const sourceFiles = [
    'packages/ag-charts-community/src/chart/data/dataController.ts',
    'packages/ag-charts-community/src/chart/data/data-model/grouping/dataGrouper.ts',
    'packages/ag-charts-community/src/chart/data/aggregateFunctions.ts',
];
const sources = Object.fromEntries(sourceFiles.map((file) => [file, variant === 'baseline'
    ? execFileSync('git', ['show', `${base}:${file}`], { encoding: 'utf8' })
    : readFileSync(file, 'utf8')]));
const outdir = 'tmp/stacked-perf';
mkdirSync(outdir, { recursive: true });
const outfile = `${outdir}/${variant}${counters ? '-counters' : ''}.mjs`;
await build({
    entryPoints: ['artifacts/stacked-series/entry.ts'], bundle: true, platform: 'node', format: 'esm',
    target: 'node24', outfile, tsconfig: 'tsconfig.base.json', loader: { '.css': 'text', '.html': 'text' },
    plugins: [{ name: 'pinned-source-and-optional-counters', setup(builder) {
        builder.onLoad({ filter: /(?:dataController|dataGrouper|aggregateFunctions)\.ts$/ }, ({ path }) => {
            const file = sourceFiles.find((name) => resolve(name) === path);
            if (!file) return;
            let contents = sources[file];
            if (counters) {
                contents = contents.replace('DataController.deepEqual(existing, clone)',
                    '(globalThis.__perfCounters.candidates++, DataController.deepEqual(existing, clone))');
                contents = contents.replace('.map((_, idx) => idx)',
                    '.map((_, idx) => { globalThis.__perfCounters.columnVisits++; return idx })');
                contents = contents.replace('for (let columnIdx = 0; columnIdx < allColumns.length; columnIdx++) {',
                    'for (let columnIdx = 0; columnIdx < allColumns.length; columnIdx++) { globalThis.__perfCounters.columnVisits++;');
                contents = contents.replace('this.areBatchesCompatible(firstBatch, otherBatch)',
                    '(globalThis.__perfCounters.batchComparisons++, this.areBatchesCompatible(firstBatch, otherBatch))');
            }
            return { contents, loader: 'ts', resolveDir: dirname(path) };
        });
    } }],
});
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
writeFileSync(`${outfile}.receipt.json`, JSON.stringify({
    base, variant, counters, node: process.version, esbuild: esbuildVersion,
    sourceSha256: Object.fromEntries(Object.entries(sources).map(([file, source]) => [file, sha256(source)])),
    bundleSha256: sha256(readFileSync(outfile)),
}, null, 2) + '\n');
