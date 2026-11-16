# Stacked-series performance contribution

**Direct total improvement from unpatched upstream:** 7293 series × 12, legend enabled: **125.0086→24.8994 s (5.021×, 80.08% less time)**, three paired renders per side on one VM. The actual final committed source was built directly; all six renders retained every series/datum and matched complete scenes, input, public state and PNGs. [Direct measurement and original archives](./total-render-final/README.md).

**Current source:** [`52f45bea`](https://github.com/popkir/ag-charts/commit/52f45beae1fd50b3a23b678219f5d1b81ffea509), four commits and thirteen code/test files. Both source branches are updated; all reports and workflow helpers remain separate.

**Additional complete-render improvement:** 7293 × 12, legend enabled: **39.7877 → 17.4754 s (2.277×, −56.08%)** on one VM, three repeats each. All 27 full renders retained complete output. **14481 unit tests passed**, 68 skipped; format/types/lint passed. Full Chromium and standard Firefox/WebKit E2E completed with eleven screenshot failures that exactly match unpatched upstream (99 PNG comparisons); one Chromium test was flaky. Browser jobs therefore remain red.

[Current implementation, complete verification, baseline comparisons and permanent archives](./optimization-validation/README.md). Upstream CI/review remain required; no upstream PR or merge has occurred.

<details>
<summary>Historical initial data-preparation record at bec53b44</summary>

# Stacked-series data preparation

This change keeps the ordinary stacked bar series and its data requests. It reduces repeated work in data preparation when many series share a dataset and stack. The original source benchmark measures `DataController.execute`, before chart rendering. A separately measured full browser render now shows **123.806 s → 51.014 s (2.427×)** for 7293 series × 12 categories, with legend enabled and identical output. [Full browser report](./full-render-7293/README.md).

Base: [`ag-grid/ag-charts@fd652e876a2b059924848a2177c82e67d6752327`](https://github.com/ag-grid/ag-charts/commit/fd652e876a2b059924848a2177c82e67d6752327), `latest`, version `14.3.0-beta.20261113`. Evidence was collected on 15 November 2026, macOS arm64, Node `24.21.0`, esbuild `0.19.9`. Node matches the repository's `^24.21.0` engine requirement.

Evidence branch: `kirill/evidence-stacked-series`. Both submission branches contain only source/tests; reports, measurements and archives remain outside the contribution diff. [Full Actions archives](./actions/README.md).

Implementation: [six-file source/test commit](https://github.com/popkir/ag-charts/commit/bec53b4495a6866beeeb1dcd727de6162b2dd3bd) · [clean fix diff](https://github.com/popkir/ag-charts/compare/fd652e876a2b059924848a2177c82e67d6752327...bec53b4495a6866beeeb1dcd727de6162b2dd3bd). The evidence in this directory is a separate fork-only commit.

## Review entry point

[Maintainer handoff and source-only patch](./SUBMISSION.md) · [repository/browser verification](./CI.md). The handoff identifies the verified commit to cherry-pick, summarises the passed checks, and documents the tooltip snapshot failure reproduced unchanged on the upstream baseline.

## Change

- Property definitions are indexed by string `property` names within the existing type/dataset/group buckets. The existing `deepEqual` check, including its key-count and skipped-key behaviour, remains the final compatibility test. Different datasets and transformations retain their existing boundaries. Non-string properties share a fallback bucket so the prefilter does not narrow structurally equal objects by reference.
- Columns are indexed by scope once, preserving column encounter order and the rule that shared columns are consumed once by the first applicable scope.
- Batch comparisons are prefiltered by the identity of `invalidData` and `invalidKeys`. The original directed `keys1.every` compatibility predicate, batch winner, scope/column order and merge operations remain unchanged.
- `range()` reuses a stateless function. Its calculation still uses `ContinuousDomain.extendDomain` and re-seeds the caller-owned output tuple. Merged aggregate definitions retain all IDs/scopes through `idsMap`.

The indexes are local to one processing call. There is no unbounded global cache. This targets the measured shared stacked-series case; arbitrary incompatible keys sharing the same invalidity references can still require repeated final compatibility checks.

## Full browser rendering

The matched 7293-series browser measurement completed three runs per revision on one VM. Median create-through-update-plus-two-frames time improved from **123.806 to 51.014 seconds** (2.427×, 58.8% less time). Every render retained all 7293 series and 87516 bar datum nodes; full scenes and PNGs were byte-identical before/after. The candidate still takes about 51 seconds. [Method, raw results, screenshots and remaining scope](./full-render-7293/README.md).

## Repeated measurements

The preparation measurements below were collected on the [original fix](https://github.com/popkir/ag-charts/commit/b2a56531f4b48e94f4533a0b94f8c96017248587). The verified source revision adds test type/assertion corrections and Prettier formatting; runtime calculations are unchanged. The original measurement receipts are preserved.

Each cell below is median milliseconds, with min–max in parentheses, from three measured runs. Each fresh worker first processes a separate 32-series warmup fixture. Both variants use the same stage wrappers. Fixture creation, request creation, explicit garbage collection and result inspection are outside the `execute` interval. Raw per-run timings, memory observations and request times are in [measurements.jsonl](./measurements.jsonl); [summary.json](./summary.json) contains the aggregates.

The positive fixture has 12 category keys and one distinct numeric `yKey` per series, one stack, animations disabled and no normalisation/cross-filtering. The request definitions come from the real production property factories used by `BarSeries.processData`.

| Series | Points | Baseline execute | Candidate execute |
| ---: | ---: | ---: | ---: |
| 1 | 12 | 0.584 (0.431–0.614) | 0.491 (0.465–0.656) |
| 10 | 120 | 1.682 (1.594–1.740) | 1.186 (1.147–1.373) |
| 100 | 1200 | 27.577 (25.560–30.862) | 7.041 (6.806–8.205) |
| 1000 | 12000 | 1553.544 (1508.511–1591.189) | 53.434 (49.926–55.172) |
| 7293 | 87516 | 95612.930 (91573.348–98062.929) | 262.565 (258.777–293.825) |

For 7293 series, the median merge stage is 52635.022 → 56.883 ms; `groupBatches` is 9389.835 → 22.270 ms. These stages are included in `execute`, not added to it. The small-case intervals and three-run sample do not establish statistical significance or a browser-latency guarantee. The 7293-series preparation ratio is about **364×**; the stock browser benchmark has only two series and reports much smaller changes. [Workload and measurement-boundary comparison](./SUBMISSION.md#what-the-speedup-numbers-mean).

The mixed fixture additionally includes negative values, `-0`, zero, absent properties, `null`, hidden series and two stacks:

| Series | Baseline execute | Candidate execute |
| ---: | ---: | ---: |
| 100 | 38.855 (36.335–42.612) | 8.604 (7.773–10.089) |
| 1000 | 1573.359 (1341.596–2990.563) | 73.195 (64.061–79.527) |
| 7293 | Not measured | 393.790 (367.790–449.302) |

No paired 7293-series mixed speedup is claimed. The mixed baseline shows substantial run-to-run variation at 1000 series.

For the positive 7293-series fixture, median retained heap growth across `execute`, with results still retained after explicit GC, was 49.36 → 38.77 MiB. Peak process RSS across the three runs was approximately 366.0 → 284.2 MiB. These observations include the fixture and worker state where applicable; they are not browser heap measurements or a leak test. Raw transient heap observations are retained because GC makes them noisy.

## Deterministic and semantic checks

Separately instrumented builds count operations; their timings are excluded from the table above. See [baseline-counters.jsonl](./baseline-counters.jsonl) and [candidate-counters.jsonl](./candidate-counters.jsonl).

| Operation | Fixture | 100 series before → after | 1000 series before → after |
| --- | --- | ---: | ---: |
| Definition candidate comparisons | Positive | 20197 → 496 | 2001997 → 4996 |
| Scope-to-column visits | Positive | 30000 → 300 | 3000000 → 3000 |
| Batch compatibility comparisons | Mixed | 3754 → 13 | 377277 → 131 |
| Aggregate definitions | Positive | 100 → 1 | 1000 → 1 |
| Aggregate definitions | Mixed, two stacks | 100 → 2 | 1000 → 2 |

Executed standalone checks, using the real source classes and synthetic data:

- Exact before/after equality of keys, raw/start/end columns, value domains, every scoped aggregate ID/domain and group-validity results at 1, 10, 100 and 1000 series, for both fixtures. Exact equality preserves signed-zero differences.
- Cached visibility changes and append/remove transactions versus fresh processing, in both variants. The existing aggregate restriction keeps incremental reprocessing disabled; the full-processing fallback remains correct.
- Overlapping column scopes, repeated keys, both scope encounter orders and a key-only scope without value columns, in both variants.
- Shared range function identity, independent returned tuples, caller-owned tuple reseeding, empty input and bigint endpoints beyond `Number.MAX_SAFE_INTEGER`.
- An independent accumulation oracle checked every one of 87516 x/raw/start/end positions and all value/range domains for each 7293-series fixture. Domain endpoint equality is numeric (signed zeros are equivalent for domain bounds); raw/start/end equality is exact. See [oracle.json](./oracle.json) and [semantic-check.json](./semantic-check.json).
- A standalone strict TypeScript 5.9.3 `noEmit` check passed for the three changed runtime modules and their source dependency closure, using installed Node 25 type declarations. This is narrower than the repository's `build:types` check. The three changed test files also passed TypeScript syntax parsing.

Deterministic regression tests have been added beside the existing `DataController`, `DataGrouper` and aggregate-function tests. They include unrelated-property comparisons, dataset/transform compatibility, aggregate aliases/scopes, signed stacks across visibility and transactional updates, overlapping scopes and incompatible invalidity arrays.

## Repository and browser checks

The normal repository checks have now been run on GitHub-hosted runners in the personal fork. Format, Community/Enterprise type checks and lint passed. The full Community suite passed **7214 tests** (16 skipped), and the full Enterprise suite passed **7258 tests** (52 skipped), including the new regression tests.

The paired targeted Chromium runs on the verified fix and upstream baseline each produced **398 passed, 3 skipped and 1 failed**. The one tooltip snapshot failure is reproduced on the baseline; actual, expected and diff images are byte-identical between both revisions and all retries. Those browser jobs remain failed; no snapshots were updated.

The official `high-perf-bar-stacked` browser benchmark also passed, with three interleaved runs per side on one runner. Its stock workload is 100000 rows and 2 series, which is distinct from the 7293-series preparation workload above. Detailed results, PNG export/cross-browser coverage, exact commands, pinned source identities and remaining scope are recorded in [CI.md](./CI.md).

These fork runs are not upstream CI approval. Maintainer review and the upstream merge gates are still required. The full browser render is separately measured at about 2.43×; the 364× source-preparation result is not a total-render claim. See the [full browser report](./full-render-7293/README.md).

## Reproduce without installing the full monorepo

Use Node 24.21.0 or a compatible version required by the repository. These commands bundle the real TypeScript data-processing classes with the esbuild version in the upstream lockfile. They do not invoke the official browser benchmark or test suite.

From a checkout containing this branch and the base commit, run:

```sh
mkdir -p tmp/stacked-perf-tools
npm install --prefix tmp/stacked-perf-tools --no-save --no-audit --no-fund esbuild@0.19.9
export STACKED_PERF_ESBUILD="$PWD/tmp/stacked-perf-tools/node_modules/esbuild/lib/main.js"
node artifacts/stacked-series/build.mjs baseline
node artifacts/stacked-series/build.mjs candidate
node artifacts/stacked-series/semantic-check.mjs
node artifacts/stacked-series/oracle.mjs

for size in 100 1000 7293; do
    node --expose-gc artifacts/stacked-series/benchmark.mjs baseline "$size" positive 3
    node --expose-gc artifacts/stacked-series/benchmark.mjs candidate "$size" positive 3
done

node artifacts/stacked-series/build.mjs baseline --counters
node artifacts/stacked-series/build.mjs candidate --counters
node artifacts/stacked-series/counters.mjs baseline
node artifacts/stacked-series/counters.mjs candidate
```

`benchmark.mjs` also accepts `mixed` as its scenario and accepts 1 or 10 as small sizes. Results append to `tmp/stacked-perf/measurements.jsonl`; build receipts include source and bundle SHA-256 values. The baseline builder reads the three original files using `git show` at the pinned base; all other source dependencies are unchanged by this patch. If a shallow clone lacks the base, fetch that exact commit with `git fetch --depth 1 --filter=blob:none https://github.com/ag-grid/ag-charts.git fd652e876a2b059924848a2177c82e67d6752327` first.

Inspect [receipt.json](./receipt.json) for the measured source hashes and boundary. Durable synthetic evidence lives here; generated bundles, logs and local installation files belong under ignored `tmp/`.

## Existing reports and submission

Searches for stacked performance, quadratic processing, `dataController`, `groupBatches` and range aggregate performance did not identify the same current fix. [Issue #3428](https://github.com/ag-grid/ag-charts/issues/3428) describes an older click-time infinite loop on missing/null values (11.0.4, AG-13928), rather than the initial many-series preparation measured here.

Upstream currently permits PR creation only for collaborators. This personal fork is a proposed fix/evidence handoff, not an upstream PR or an accepted change. Adoption requires maintainer review, normal CI, merge and an official release; no acceptance or release date is assumed.

</details>
