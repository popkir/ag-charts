<!-- current-integration:start -->
# Current source branch and evidence

**Submit only [`kirill/perf-stacked-series`](https://github.com/popkir/ag-charts/tree/kirill/perf-stacked-series) as a PR against upstream `latest`.** It is the fork default. Current head `64f85dea3b32382b6ef4169c0f684ee4a21e4e87` includes upstream `d78787368dc6b5ff88d6dbe144df639d8dd012cf`; the PR diff remains thirteen code/test files, identical to the original contribution patch.

`kirill/evidence-stacked-series` holds reports, recoverable Git history and verification workflows. The third fork branch `latest` is retained by explicit owner decision and is not the PR source. All seventeen obsolete helper/duplicate branches have been removed.

**Current exact-head checks:** format/types/lint, full native/E2E and three-pair latest→merged-source full-render verification are running in [run 43859617103](https://github.com/popkir/ag-charts/actions/runs/43859617103). [Current branch map, integration and recoverable backup](../consolidation/README.md). Earlier results below are historical measurements of pre-sync `52f45bea`, not results relabelled for the merged head. A targeted maintainer follow-up will link the completed verification.
<!-- current-integration:end -->

<details>
<summary>Historical pre-sync documentation (preserved)</summary>

# Stacked-series rendering optimisations: source and complete verification

**Direct total improvement from unpatched upstream:** 7293 series × 12, legend enabled: **125.0086→24.8994 s (5.021×, 80.08% less time)**, three paired renders per side on one VM. The actual final committed source was built directly; all six renders retained every series/datum and matched complete scenes, input, public state and PNGs. [Direct measurement and original archives](../total-render-final/README.md).

The contribution is now on [`52f45bea`](https://github.com/popkir/ag-charts/commit/52f45beae1fd50b3a23b678219f5d1b81ffea509), with four source commits and thirteen code/test files. The three rendering optimisations follow the original data-preparation fix. Both submission branches point to this head. Reports, archives and workflow helpers are outside the submission diff.

## Result

A paired full-browser experiment with **7293 enabled stacked bar series × 12 categories = 87516 points**, legend enabled and animations disabled, measured **39.7877 s → 17.4754 s** through settled update plus two animation frames: **2.277×**, or **56.08% less time**. These are medians of three runs each on one VM. Individual final-candidate runs were 17.7624 / 17.4669 / 17.4754 s; the control was 40.4391 / 37.8934 / 39.7877 s. Paired ratios were 2.277 / 2.169 / 2.277.

This is the **additional** improvement over the original data-preparation patch (`bec53b44`), not an unpatched-upstream versus final-head comparison. It must not be multiplied by the earlier 2.427× result from another host. The approximately 17-second result is still slow and is not a prediction of application loading time.

| Isolated variant in the same final A/B run | Median complete initial render | Reduction from control |
|---|---:|---:|
| Original data-preparation patch, control | 39.7877 s | — |
| Legend batching + scoped missing definitions | 24.4375 s | 38.58% |
| Group-scale reuse with scalar snapshots | 32.8085 s | 17.54% |
| All three optimisations | **17.4754 s** | **56.08%** |

[Complete experimental measurements](./experiment-summary.json), [A/B workflow](https://github.com/popkir/ag-charts/actions/runs/43786659217), [independent A/B audit](./experiments/43786659217/parent-verification.json). The original conservative scale cache had zero hits and no convincing timing benefit; its negative result and miss counters are retained. The corrected version invalidates only on real state changes while retaining scalar snapshots for in-place grouping mutations.

## Implementation and compatibility

- [`d65edede`](https://github.com/popkir/ag-charts/commit/d65edede3fdeec26a5fb490becbba093687c7a6a) — perf: batch stacked series legend updates.
- [`b4aa2cdb`](https://github.com/popkir/ag-charts/commit/b4aa2cdb0b84e29f727c93ab8bd302a6d935978a) — perf: index missing data definitions by scope.
- [`52f45bea`](https://github.com/popkir/ag-charts/commit/52f45beae1fd50b3a23b678219f5d1b81ffea509) — perf: reuse unchanged bar group scales.

- Legend writes retain intermediate reads, empty-record insertion order, nested batches, immutable prior snapshots and partial updates when callbacks throw. Existing public options and SDK entry points are unchanged.
- The missing-data index retains definition references, not cached counts, so incremental changes remain visible; legacy unscoped definitions retain the full-scan fallback.
- Group-scale reuse checks grouping/visibility/width revision, axis identity/type/padding, bandwidth and current scale state. Scalar snapshots detect grouping objects mutated in place; redundant series updates do not discard the cache.
- No series or data are omitted, and no new runtime dependency is added. Every canonical render retained all 7293 series, 7293 visible legend entries and 87516 finite, positive-sized datum rectangles.

All **27 uninstrumented full-size renders** passed complete scene, geometry, PNG and public-state equivalence checks. A separate 64-series browser matrix compared three builds through **13 stages**, including actual pagination, hide/re-enable, state restoration, missing/null/zero/mixed-sign data, normalised stacks, resize, add/remove/reorder, mouse picking and tooltip, keyboard toggling, PNG export and download. All 36 scene/PNG snapshot pairs matched. [Matrix run](https://github.com/popkir/ag-charts/actions/runs/43788140772), [independent audit](./experiments/43788140772/parent-verification.json).

The promoted code differs from the measured prototype by formatting and TypeScript-only declarations. An independent fixed-options compilation of all four production files emitted identical JavaScript: [runtime equivalence receipt](./runtime-equivalence.json). This is a standalone source comparison, not a claim of a new measured application run or a full production-bundle checksum.

## Exact promoted source verification

The complete committed source tree is **`c72fed50b4964896611eed6a69fb820e0efdf15e`**. Before each check, the isolated harness applied a checksummed patch to `bec53b44` and reconstructed that exact tree from the complete seven-file follow-up diff. After committing, `HEAD^{tree}` was independently confirmed equal. Harness commits and workflow files are separate from the submission branch.

| Check | Result |
|---|---|
| Official `yarn nx format`, format check, Community/Enterprise types and lint | **Passed** |
| Complete Community unit suite | **7223 passed**, 16 skipped |
| Complete Enterprise unit suite | **7258 passed**, 52 skipped |
| Complete Chromium website E2E, eight shards, all six framework variants | **5191 passed**, 8 skipped, **9 failed**, 1 flaky |
| Standard Firefox/WebKit suite | **220 passed**, 24 skipped, **2 failed** |

[Quality/native verification run](https://github.com/popkir/ag-charts/actions/runs/43832785047), [complete website run](https://github.com/popkir/ag-charts/actions/runs/43838758393), [machine-readable summary](./verification-summary.json), [checksummed source manifest](./manifest.json).

The final website run includes the upstream CI prerequisite `yarn nx docs-resolved-interfaces ag-charts-types`. The first full attempt omitted that prerequisite and exposed 54 documentation/reference-page failures; the corrected run resolved all 54. Earlier failed setup/style attempts and their complete logs remain archived. No library changes were made to resolve those documentation-environment failures.

### Browser jobs remain red: baseline attribution

**This is not completely green E2E.** Every one of the eleven stable screenshot failures also occurs on **unmodified original upstream `fd652e87`**, before any contribution commit:

- `interactive-tooltip.spec.ts:49`, “hover 4 steps”: Chromium, Firefox and WebKit.
- `keyboard-nav.spec.ts`: basic keyboard navigation in all six framework variants, plus two initial-focus cases.

For all three attempts of every failed case, the **actual, expected and diff PNG bytes match exactly: 99 images**. The full upstream Firefox/WebKit comparison has 220 passed, 24 skipped and the same two failures. The upstream keyboard suite has 86 passed and the same eight failures.

[Original upstream comparison run](https://github.com/popkir/ag-charts/actions/runs/43840362951), [Chromium tooltip proof](./upstream-chromium-tooltip-comparison.json), [Firefox/WebKit tooltip proof](./upstream-cross-browser-comparison.json), [keyboard proof](./upstream-keyboard-comparison.json). The Chromium tooltip reference also reuses the fully retained original upstream run [43726542138](https://github.com/popkir/ag-charts/actions/runs/43726542138).

No snapshot references, tolerances, test selections or retry policy were changed to hide these failures. The full website run includes one sparklines reflow test that passed on retry; its flaky status is preserved, not attributed to upstream without a dedicated comparative experiment.

## Upstream status

The full thirteen-file contribution cleanly applies to upstream `latest` at `9ee57509a4141b2477b6c3220efac87e1010982a`, which is twelve commits beyond the original base and has no overlapping changed paths. [Read-only application receipt](./upstream-applicability.json). This is an applicability check in an isolated index, **not CI on that newer upstream revision**.

Required upstream checks on the intended merge state and maintainer acceptance remain outstanding. Upstream PR creation is still `collaborators_only`; no upstream PR, merge or release has occurred. A maintainer can review/cherry-pick the source commits using the [current submission handoff](../SUBMISSION.md).

## Permanent evidence

Original native build/results ZIPs, complete job-log ZIPs, HTML reports, traces, raw CPU profiles, full scenes and PNGs are preserved without rewriting their ZIP contents. Failed experiments and failed harness attempts are included. Each original artifact digest and ZIP CRC was checked; metadata retain original Actions expiry dates.

- [Download all new HTML/report/trace/log ZIPs](./ARCHIVES.md).
- [Direct original→final total-render archive](../total-render-final/README.md#permanent-archives): 4 original ZIPs, 16453674 bytes.
- [Twelve-run optimisation archive](./experiment-summary.json): 27 original ZIPs, 81,418,363 bytes.
- [Eight-run delivery/attribution archive](./delivery-archive-index.json): 35 original ZIPs, 221,897,828 bytes.
- [Earlier eight-run verification archive](../actions/README.md): 21 original ZIPs, 119,775,939 bytes.
- [Checksums of the new archive files](./SHA256SUMS).

Together these retain **87 original ZIPs across 29 workflow runs**, 439,545,804 bytes. They are on a separate evidence branch and do not appear in the contribution diff. The source manifest, original workflow snapshots and exact helper SHAs allow inspection of the tested code and environment.


</details>
