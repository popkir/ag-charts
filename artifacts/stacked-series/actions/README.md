# Complete evidence archive index

The complete contribution evidence now retains **87 original ZIPs across 29 runs**, outside the source branches. [Download all new optimisation and full E2E ZIPs](../optimization-validation/ARCHIVES.md) adds 27 experimental ZIPs and 35 delivery/attribution ZIPs to the original 21 below. All are checksummed, including unsuccessful attempts. [New direct unpatched→final benchmark archives](../total-render-final/README.md#permanent-archives) add 4 ZIPs.

<details>
<summary>Original eight-run archive: 21 ZIPs</summary>

# Permanent GitHub Actions archives

All **21 ZIP archives** from 8 verification runs are retained: all 13 uploaded artifacts and complete logs for every run (114.23 MiB). Original artifact ZIPs match GitHub SHA-256 digests; all ZIPs passed CRC checks.

Evidence lives on \`kirill/evidence-stacked-series\`. Both submission branches remain the one-commit, six-file source change. These archives are outside the contribution diff.

[Maintainer handoff](../SUBMISSION.md) · [validation](../CI.md) · [7293-series full browser results](../full-render-7293/README.md) · [manifest](./manifest.json) · [SHA-256 checksums](./SHA256SUMS)

## Download and inspect

Each archive link opens the preserved GitHub file; use **Download raw file**. These commit-pinned copies do not depend on Actions retention. Extract the report ZIP with its directories intact; HTML reports need their accompanying data directory. Use the Playwright report/trace viewers for HTML reports and nested trace ZIPs. Raw scene snapshots are gzip-compressed JSON.

## Runs and archives

### 43724323719: Historical first source verification

[Original run](https://github.com/popkir/ag-charts/actions/runs/43724323719) · conclusion: **failure** · [metadata](./43724323719/run.json) · [workflow](./43724323719/workflow.yml)

| Archive | Bytes | Contents |
| --- | ---: | --- |
| [run-logs.zip](./43724323719/run-logs.zip) | 169157 | complete job logs |
| [stacked-browser-reports.zip](./43724323719/stacked-browser-reports.zip) | 2959776 | 41 entries, 4 html, 1 xml, 2 traceZips |
| [stacked-native-reports.zip](./43724323719/stacked-native-reports.zip) | 159061 | 1 entries, 0 html, 1 xml, 0 traceZips |

### 43726123623: Formatter helper

[Original run](https://github.com/popkir/ag-charts/actions/runs/43726123623) · conclusion: **success** · [metadata](./43726123623/run.json) · [workflow](./43726123623/workflow.yml)

| Archive | Bytes | Contents |
| --- | ---: | --- |
| [run-logs.zip](./43726123623/run-logs.zip) | 6541 | complete job logs |
| [stacked-formatter-patch.zip](./43726123623/stacked-formatter-patch.zip) | 2939 | 1 entries, 0 html, 0 xml, 0 traceZips |

### 43726542138: Final native suites and paired Chromium checks

[Original run](https://github.com/popkir/ag-charts/actions/runs/43726542138) · conclusion: **failure** · [metadata](./43726542138/run.json) · [workflow](./43726542138/workflow.yml)

| Archive | Bytes | Contents |
| --- | ---: | --- |
| [run-logs.zip](./43726542138/run-logs.zip) | 230171 | complete job logs |
| [stacked-browser-baseline-reports.zip](./43726542138/stacked-browser-baseline-reports.zip) | 2278986 | 41 entries, 4 html, 1 xml, 2 traceZips |
| [stacked-browser-reports.zip](./43726542138/stacked-browser-reports.zip) | 2234999 | 40 entries, 4 html, 1 xml, 2 traceZips |
| [stacked-native-reports.zip](./43726542138/stacked-native-reports.zip) | 343777 | 2 entries, 0 html, 2 xml, 0 traceZips |

### 43726854766: Official two-series browser benchmark

[Original run](https://github.com/popkir/ag-charts/actions/runs/43726854766) · conclusion: **success** · [metadata](./43726854766/run.json) · [workflow](./43726854766/workflow.yml)

| Archive | Bytes | Contents |
| --- | ---: | --- |
| [run-logs.zip](./43726854766/run-logs.zip) | 87643 | complete job logs |
| [stacked-browser-benchmark-results.zip](./43726854766/stacked-browser-benchmark-results.zip) | 11892 | 7 entries, 0 html, 0 xml, 0 traceZips |
| [stacked-site-base.zip](./43726854766/stacked-site-base.zip) | 50833942 | 1 entries, 0 html, 0 xml, 0 traceZips |
| [stacked-site-head.zip](./43726854766/stacked-site-head.zip) | 50798391 | 1 entries, 0 html, 0 xml, 0 traceZips |

### 43728327077: Historical first cross-browser configuration attempt

[Original run](https://github.com/popkir/ag-charts/actions/runs/43728327077) · conclusion: **failure** · [metadata](./43728327077/run.json) · [workflow](./43728327077/workflow.yml)

| Archive | Bytes | Contents |
| --- | ---: | --- |
| [run-logs.zip](./43728327077/run-logs.zip) | 71766 | complete job logs |

### 43729070987: Final PNG and three-browser probes

[Original run](https://github.com/popkir/ag-charts/actions/runs/43729070987) · conclusion: **success** · [metadata](./43729070987/run.json) · [workflow](./43729070987/workflow.yml)

| Archive | Bytes | Contents |
| --- | ---: | --- |
| [run-logs.zip](./43729070987/run-logs.zip) | 114176 | complete job logs |
| [stacked-export-base-reports.zip](./43729070987/stacked-export-base-reports.zip) | 423798 | 6 entries, 2 html, 2 xml, 0 traceZips |
| [stacked-export-head-reports.zip](./43729070987/stacked-export-head-reports.zip) | 423956 | 6 entries, 2 html, 2 xml, 0 traceZips |

### 43774220145: Historical 32-series full-render pilot layout assertion

[Original run](https://github.com/popkir/ag-charts/actions/runs/43774220145) · conclusion: **failure** · [metadata](./43774220145/run.json) · [workflow](./43774220145/workflow.yml)

| Archive | Bytes | Contents |
| --- | ---: | --- |
| [full-render-7293-results.zip](./43774220145/full-render-7293-results.zip) | 183159 | 10 entries, 1 png, 1 sceneGzip, 1 traceZips, 0 html, 0 xml |
| [run-logs.zip](./43774220145/run-logs.zip) | 24227 | complete job logs |

### 43774538081: Successful complete 7293-series browser rendering

[Original run](https://github.com/popkir/ag-charts/actions/runs/43774538081) · conclusion: **success** · [metadata](./43774538081/run.json) · [workflow](./43774538081/workflow.yml)

| Archive | Bytes | Contents |
| --- | ---: | --- |
| [full-render-7293-results.zip](./43774538081/full-render-7293-results.zip) | 8386472 | 62 entries, 12 png, 8 sceneGzip, 2 traceZips, 0 html, 0 xml |
| [run-logs.zip](./43774538081/run-logs.zip) | 31110 | complete job logs |

The final native job passed; its run retains the targeted Chromium snapshot failure also reproduced on the unpatched baseline. The first full-render attempt stopped at a 32-series screenshot-container assertion, before canonical 7293-series measurements. Historical failed attempts are retained, not presented as successful checks.

The successful full-render run includes six canonical measurements (three per revision), two excluded 32-series pilots, raw scene snapshots, PNGs, JSON reports and pilot traces. Tracing was disabled for canonical timings.

## Integrity

\`manifest.json\` records original artifact IDs, run IDs, expiry times, byte counts, SHA-256 digests and ZIP CRC checks. Exact workflow definitions and run metadata are preserved beside each run. Verify archives and metadata from this directory with:

\`\`\`sh
shasum -a 256 -c SHA256SUMS
\`\`\`

</details>
