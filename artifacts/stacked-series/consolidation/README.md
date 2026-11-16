# Canonical branches and latest integration

There are two intended branches in this fork:

- **Source to submit as a PR against upstream `latest`: [`kirill/perf-stacked-series`](https://github.com/popkir/ag-charts/tree/kirill/perf-stacked-series).** Current head `ae4e8907037ca9aec35f19d6898d3cfb8da84721` includes upstream `latest` `9ee57509a4141b2477b6c3220efac87e1010982a`. The contribution remains exactly thirteen code/test files; its full-index patch is byte-identical to the previously verified four performance commits.
- **Reports, recoverable history and verification workflows: `kirill/evidence-stacked-series`.** Do not merge this evidence branch into upstream.

Current exact integrated tree: `757aa8f66a63ddcab10e42735eea39d3cd44dc88`. The dedicated [validation workflow](../../../../.github/workflows/stacked-series-validation.yml) checks the actual pinned source, not an overlay. It runs official format/types/lint, both full native suites, all eight Chromium E2E shards and six frameworks, standard Firefox/WebKit, an unmodified latest comparison for earlier screenshot discrepancies, and three paired full 7293-series renders of latest versus the merged contribution. Results are pending; earlier checks do not substitute for this new source head.

The previous [direct total result](../total-render-final/README.md) remains historical measurement of original `fd652e87` to pre-sync `52f45bea`: 125.0086→24.8994 seconds, 5.021×. It is not relabelled as timing of the new merged head.

## Recovering obsolete technical branches

All eighteen exact removal candidates are listed in [branch-backup.json](./branch-backup.json). The old fork `latest` equals original upstream `fd652e87`, retained in the source ancestry. Every other candidate has a named head in [obsolete-branches.bundle](./obsolete-branches.bundle), a 105881-byte thin Git bundle verified by `git bundle verify`. Its prerequisite `fd652e876a2b059924848a2177c82e67d6752327` remains reachable from the kept source branch. The previous original ZIPs and helper/workflow snapshots remain intact; removing technical branches does not remove their archived evidence.

To inspect and restore a specific obsolete helper in an existing clone with the prerequisite:

```sh
git bundle verify artifacts/stacked-series/consolidation/obsolete-branches.bundle
git bundle list-heads artifacts/stacked-series/consolidation/obsolete-branches.bundle
git fetch artifacts/stacked-series/consolidation/obsolete-branches.bundle refs/remotes/personal/kirill/benchmark-total-stacked-final:refs/heads/restored-benchmark
```

No upstream PR, upstream merge, release or deployment has occurred. Maintainer review and required upstream checks remain necessary. The current contribution route is collaborator-only; outreach will request a normal submission route for personal account `popkir` on behalf of CLIMATISE, without requesting maintainer/admin rights.
