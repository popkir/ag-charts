import { pathToFileURL } from 'node:url';
import { setup, syntheticData } from './fixture.mjs';
const variant = process.argv[2];
if (!['baseline', 'candidate'].includes(variant)) throw new Error('Expected baseline or candidate');
const lib = await import(pathToFileURL(`${process.cwd()}/tmp/stacked-perf/${variant}-counters.mjs`));
for (const scenario of ['positive', 'mixed']) {
    for (const series of [100, 1000]) {
        const { controller, requests } = setup(lib, syntheticData(series, scenario), series, scenario);
        globalThis.__perfCounters = { candidates: 0, columnVisits: 0, batchComparisons: 0 };
        const cache = controller.execute(undefined, undefined);
        await Promise.all(requests);
        console.log(JSON.stringify({ variant, scenario, series, ...globalThis.__perfCounters,
            aggregates: cache[0].opts.props.filter((property) => property.type === 'aggregate').length }));
    }
}
