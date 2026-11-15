# Permanent GitHub Actions archives

All **17 ZIP archives** from the six verification runs are preserved here (106.00 MiB): all 11 uploaded artifacts and the complete job logs for all six runs. The original ZIP bytes passed CRC validation. Every artifact ZIP also matched the SHA-256 digest reported by GitHub.

This directory lives only on `kirill/evidence-stacked-series`. The source-only contribution branch is `kirill/perf-stacked-series-checked`; neither submission branch includes these reports or archives.

[Maintainer handoff](../SUBMISSION.md) · [validation and performance scope](../CI.md) · [archive manifest](./manifest.json) · [SHA-256 checksums](./SHA256SUMS)

## Download an archive

Each ZIP filename below links to its GitHub file page, where **Download raw file** retrieves the preserved ZIP. The commit-pinned links in the issue and PR description keep these files available independently of the original Actions expiry.

## Runs and archives

### 43724323719: Historical first source verification

[Original run](https://github.com/popkir/ag-charts/actions/runs/43724323719) · conclusion: **failure** · [metadata](./43724323719/run.json) · [exact workflow](./43724323719/workflow.yml)

| Archive | Bytes | Contents |
| --- | ---: | --- |
| [run-logs.zip](./43724323719/run-logs.zip) | 169157 | complete job logs |
| [stacked-browser-reports.zip](./43724323719/stacked-browser-reports.zip) | 2959776 | 41 files; 4 HTML, 1 XML, 2 nested ZIPs |
| [stacked-native-reports.zip](./43724323719/stacked-native-reports.zip) | 159061 | 1 files; 0 HTML, 1 XML, 0 nested ZIPs |

### 43726123623: Formatter helper

[Original run](https://github.com/popkir/ag-charts/actions/runs/43726123623) · conclusion: **success** · [metadata](./43726123623/run.json) · [exact workflow](./43726123623/workflow.yml)

| Archive | Bytes | Contents |
| --- | ---: | --- |
| [run-logs.zip](./43726123623/run-logs.zip) | 6541 | complete job logs |
| [stacked-formatter-patch.zip](./43726123623/stacked-formatter-patch.zip) | 2939 | 1 files; 0 HTML, 0 XML, 0 nested ZIPs |

### 43726542138: Final native suites and paired Chromium checks

[Original run](https://github.com/popkir/ag-charts/actions/runs/43726542138) · conclusion: **failure** · [metadata](./43726542138/run.json) · [exact workflow](./43726542138/workflow.yml)

| Archive | Bytes | Contents |
| --- | ---: | --- |
| [run-logs.zip](./43726542138/run-logs.zip) | 230171 | complete job logs |
| [stacked-browser-baseline-reports.zip](./43726542138/stacked-browser-baseline-reports.zip) | 2278986 | 41 files; 4 HTML, 1 XML, 2 nested ZIPs |
| [stacked-browser-reports.zip](./43726542138/stacked-browser-reports.zip) | 2234999 | 40 files; 4 HTML, 1 XML, 2 nested ZIPs |
| [stacked-native-reports.zip](./43726542138/stacked-native-reports.zip) | 343777 | 2 files; 0 HTML, 2 XML, 0 nested ZIPs |

### 43726854766: Official stacked-bar browser benchmark

[Original run](https://github.com/popkir/ag-charts/actions/runs/43726854766) · conclusion: **success** · [metadata](./43726854766/run.json) · [exact workflow](./43726854766/workflow.yml)

| Archive | Bytes | Contents |
| --- | ---: | --- |
| [run-logs.zip](./43726854766/run-logs.zip) | 87643 | complete job logs |
| [stacked-browser-benchmark-results.zip](./43726854766/stacked-browser-benchmark-results.zip) | 11892 | 7 files; 0 HTML, 0 XML, 0 nested ZIPs |
| [stacked-site-base.zip](./43726854766/stacked-site-base.zip) | 50833942 | 1 files; 0 HTML, 0 XML, 0 nested ZIPs |
| [stacked-site-head.zip](./43726854766/stacked-site-head.zip) | 50798391 | 1 files; 0 HTML, 0 XML, 0 nested ZIPs |

### 43728327077: Historical first cross-browser configuration attempt

[Original run](https://github.com/popkir/ag-charts/actions/runs/43728327077) · conclusion: **failure** · [metadata](./43728327077/run.json) · [exact workflow](./43728327077/workflow.yml)

| Archive | Bytes | Contents |
| --- | ---: | --- |
| [run-logs.zip](./43728327077/run-logs.zip) | 71766 | complete job logs |

### 43729070987: Final PNG and three-browser probes

[Original run](https://github.com/popkir/ag-charts/actions/runs/43729070987) · conclusion: **success** · [metadata](./43729070987/run.json) · [exact workflow](./43729070987/workflow.yml)

| Archive | Bytes | Contents |
| --- | ---: | --- |
| [run-logs.zip](./43729070987/run-logs.zip) | 114176 | complete job logs |
| [stacked-export-base-reports.zip](./43729070987/stacked-export-base-reports.zip) | 423798 | 6 files; 2 HTML, 2 XML, 0 nested ZIPs |
| [stacked-export-head-reports.zip](./43729070987/stacked-export-head-reports.zip) | 423956 | 6 files; 2 HTML, 2 XML, 0 nested ZIPs |

The final native job passed; its parent run remains failed because both targeted Chromium jobs reproduce the same baseline tooltip snapshot failure. The earlier failed attempts are retained as historical provenance, not described as passing checks.

The two `stacked-site-*.zip` artifacts also retain the original built benchmark sites (each contains the original site tarball), so the complete artifact set is archived.

## Inspect HTML reports and traces

For the final candidate Chromium report, extract `43726542138/stacked-browser-reports.zip`. The ZIP includes the HTML report, its data, the JSON/JUnit results and failure traces. The baseline and PNG-probe archives preserve their corresponding complete report directories.

Use the report directory with the Playwright report viewer, or open a preserved trace ZIP in the Playwright trace viewer. Keep the HTML report and its data directory together. These files are the original report outputs, not regenerated reports.

## Integrity and provenance

- `manifest.json` records each original artifact ID, run ID, original expiry, size, SHA-256, GitHub digest and verified ZIP CRC.
- `run.json` and `workflow.yml` beside each run identify its original head and exact workflow definition.
- `SHA256SUMS` covers every archive, run metadata file, workflow and the manifest.

From this directory, verify the saved bytes with:

```sh
shasum -a 256 -c SHA256SUMS
```
