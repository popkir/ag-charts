# Historical first integration: ae4e8907 over upstream 9ee57509

This records the completed first integration, before upstream moved forward again. Immutable source `ae4e8907037ca9aec35f19d6898d3cfb8da84721`, target base `9ee57509a4141b2477b6c3220efac87e1010982a`. The current PR branch is newer; follow the [canonical branch handoff](../../README.md).

[Workflow 43854079208](https://github.com/popkir/ag-charts/actions/runs/43854079208) ran official format/check, Community/Enterprise types/lint, both complete native suites, all eight Chromium shards and all six frameworks, standard Firefox/WebKit and a direct three-pair full 7293-series browser comparison.

- Quality and native passed: **14522 unit tests passed**, 68 skipped.
- Chromium: 5191 passed, 8 skipped, 9 failed, 1 flaky.
- Firefox/WebKit: 220 passed, 24 skipped, 2 failed. All eleven stable failures reproduce on unmodified 9ee57509, with **99 byte-identical actual/expected/diff PNGs** across all retries. Browser jobs remain red; flaky status is disclosed.
- Direct current-base→integrated-source full render: **100.0997→20.5486s, 4.871×**, three pairs on one AMD EPYC 9V74 VM. All 87516 positive datum rectangle, all 7293 series and enabled legend records were retained. Full scenes, inputs, PNGs and public states matched.

[Machine-readable complete summary](./verification-summary.json) · [99-image comparison](./upstream-comparison.json) · [full independent render audit](./performance-audit.json).

## Permanent original archives

Open each archive and use Download raw file. Preserve directory structure when extracting Playwright HTML reports; nested trace ZIPs are inside the original report archives. SHA-256, GitHub artifact digests and ZIP CRCs were verified. [Archive manifest](../../actions/43854079208/archive-manifest.json) · [workflow](../../actions/43854079208/workflow.yml) · [all jobs](../../actions/43854079208/jobs.json).

| Original archive | Bytes |
| --- | ---: |
| [run-logs.zip](../../actions/43854079208/run-logs.zip) | 2457047 |
| [stacked-merged-build-base.zip](../../actions/43854079208/stacked-merged-build-base.zip) | 3742334 |
| [stacked-merged-build-head.zip](../../actions/43854079208/stacked-merged-build-head.zip) | 3745516 |
| [stacked-merged-cross-browser.zip](../../actions/43854079208/stacked-merged-cross-browser.zip) | 3021467 |
| [stacked-merged-e2e-1.zip](../../actions/43854079208/stacked-merged-e2e-1.zip) | 2247505 |
| [stacked-merged-e2e-2.zip](../../actions/43854079208/stacked-merged-e2e-2.zip) | 2606887 |
| [stacked-merged-e2e-3.zip](../../actions/43854079208/stacked-merged-e2e-3.zip) | 2618440 |
| [stacked-merged-e2e-4.zip](../../actions/43854079208/stacked-merged-e2e-4.zip) | 2163719 |
| [stacked-merged-e2e-5.zip](../../actions/43854079208/stacked-merged-e2e-5.zip) | 2077580 |
| [stacked-merged-e2e-6.zip](../../actions/43854079208/stacked-merged-e2e-6.zip) | 1992102 |
| [stacked-merged-e2e-7.zip](../../actions/43854079208/stacked-merged-e2e-7.zip) | 2183348 |
| [stacked-merged-e2e-8.zip](../../actions/43854079208/stacked-merged-e2e-8.zip) | 31758140 |
| [stacked-merged-native.zip](../../actions/43854079208/stacked-merged-native.zip) | 345380 |
| [stacked-merged-quality.zip](../../actions/43854079208/stacked-merged-quality.zip) | 3104 |
| [stacked-merged-render-results.zip](../../actions/43854079208/stacked-merged-render-results.zip) | 8854993 |
| [stacked-merged-upstream-baseline.zip](../../actions/43854079208/stacked-merged-upstream-baseline.zip) | 24246628 |
