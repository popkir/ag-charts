# Who is active on upstream latest

The current inspected upstream head is `9ee57509a4141b2477b6c3220efac87e1010982a`. The [captured public activity](./upstream-activity.json) separates commit authors/committers, actual PR mergers and available push-event actors.

**Alan Treadway (`@alantreadway`) is the verified merger of both changes that moved latest forward:** [#9094](https://github.com/ag-grid/ag-charts/pull/9094), crosshairs disabled by default except financial charts; and [#9097](https://github.com/ag-grid/ag-charts/pull/9097), agentic context maintenance. Both merged on 16 November 2026. The public event sample also explicitly records three pushes to latest by Alan on 13 November, including the original baseline `fd652e87`. The public event feed is partial; it does not establish every push or the actor of any unobserved push.

Most commits within those two new PRs were authored by `claude[bot]` or `github-actions[bot]`; the PR author is `ag-jira-agent-ci[bot]`. These automated identities should not be treated as human maintainers.

Other human accounts appearing in the latest 50-commit sample:

| Account | Public name / verified activity |
| --- | --- |
| [alantreadway](https://github.com/alantreadway) | Alan Treadway; 10 authored commits including merge commits; actual merger of both newest PRs |
| [AG-DavidG](https://github.com/AG-DavidG) | 3 authored commits; markers/palette/upgrade documentation; already addressed in our issue |
| [iMoses](https://github.com/iMoses) | 5 authored commits; sync manager/module ownership; profile says Principal Software Developer at ag-Grid |
| [taktran](https://github.com/taktran) | Tak Tran; 4 authored commits; website/shared examples and developer toolbar |
| [lsjroberts](https://github.com/lsjroberts) | Laurence Roberts; 2 authored commits; legend-border documentation |
| [yinkelly](https://github.com/yinkelly) | 1 authored commit; pattern-tile shape fill behaviour |
| [olegat](https://github.com/olegat) | Oli Legat; committer on popover lifecycle work; profile lists @ag-grid |

The planned targeted follow-up addresses Alan and David in the existing issue after verifying the synced branch. It introduces Kirill Popov as CTO of CLIMATISE, links the single source branch and separate evidence branch, and asks how personal GitHub account `popkir` can submit a normal PR under the collaborator-only creation policy. It requests no maintainer/admin privileges and makes no unverified Enterprise-support entitlement claim.
