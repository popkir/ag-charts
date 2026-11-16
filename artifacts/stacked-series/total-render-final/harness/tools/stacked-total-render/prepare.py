#!/usr/bin/env python3
"""Prepare a custom workload over the exact previously verified browser bundles."""
import concurrent.futures
import hashlib
import json
from pathlib import Path
import tarfile
import urllib.request
import zipfile

EVIDENCE = "b3c820cc5b6ccf82333979e331db2d457d040dc5"
ARCHIVE_ROOT = (
    "https://raw.githubusercontent.com/popkir/ag-charts/" + EVIDENCE
    + "/artifacts/stacked-series/actions/43726854766/"
)
EXPECTED = {
    "base": {
        "source": "fd652e876a2b059924848a2177c82e67d6752327",
        "zip": "021b43b75506081b9cd57107c39803ab45519f89de99c977ef7eaf76edc698e7",
        "umd": "0144e3db7fada5ede027281de91a2e2ded33922d41222cfe72e7758308129f40",
    },
    "head": {
        "source": "bec53b4495a6866beeeb1dcd727de6162b2dd3bd",
        "zip": "bdc46df075ac25e46bfe3a43d0ed4ce4257290269447f8e6d1af10726ff06840",
        "umd": "9d14b0fb7d607b89506cafa251cb2a621dbb8310e9e1fd8b608cf60e7324cc2e",
    },
}
EXAMPLE = "vanilla/benchmarks/examples/high-perf-bar-stacked/"
UMD = "dev/ag-charts-enterprise/dist/umd/ag-charts-enterprise.js"
ROOT = Path("tmp/stacked-total-render/sites")
REPORTS = Path("tmp/stacked-total-render/results")
ROOT.mkdir(parents=True, exist_ok=True)
REPORTS.mkdir(parents=True, exist_ok=True)


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def prepare(role):
    expected = EXPECTED[role]
    archive = ROOT / ("stacked-site-" + role + ".zip")
    urllib.request.urlretrieve(ARCHIVE_ROOT + archive.name, archive)
    if sha256(archive.read_bytes()) != expected["zip"]:
        raise RuntimeError("Archived build checksum mismatch: " + role)
    destination = ROOT / role
    destination.mkdir(exist_ok=True)
    retained = {}
    with zipfile.ZipFile(archive) as zipped:
        if zipped.testzip() is not None:
            raise RuntimeError("Invalid ZIP archive")
        with tarfile.open(fileobj=zipped.open(zipped.namelist()[0]), mode="r|gz") as tar:
            for member in tar:
                wanted = member.name == UMD or (
                    member.name.startswith(EXAMPLE)
                    and "/" not in member.name[len(EXAMPLE):]
                    and member.name.endswith((".js", ".css", ".html"))
                )
                if not wanted or not member.isfile():
                    continue
                if member.name.startswith("/") or ".." in Path(member.name).parts:
                    raise RuntimeError("Unsafe archive path")
                data = tar.extractfile(member).read()
                target = destination / member.name
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(data)
                retained[member.name] = {"sha256": sha256(data), "bytes": len(data)}
    if retained[UMD]["sha256"] != expected["umd"]:
        raise RuntimeError("Unmatched runtime bundle")
    for name, expected_hash in [
        ("benchmarkHarness.js", "3be11c47c1f4aa7c9433867621e6cf8773b1fa9e5c15812fb891a94757a69a9a"),
        ("benchmarkUtils.js", "7f38bc8bc5bf62c3e40d407fdd9fd584fa1404cb46f581d133e6d869ac60f876"),
    ]:
        if retained[EXAMPLE + name]["sha256"] != expected_hash:
            raise RuntimeError("Upstream benchmark helper differs")
    original = (destination / (EXAMPLE + "main.js")).read_text()
    end_marker = "/** DARK MODE END **/"
    start_marker = "/** E2E THEME START **/"
    stop_marker = "/** E2E THEME END **/"
    if any(marker not in original for marker in [end_marker, start_marker, stop_marker]):
        raise RuntimeError("Upstream example transformations changed")
    prefix = original[:original.index(end_marker) + len(end_marker)]
    capture = original[original.index(start_marker):original.index(stop_marker) + len(stop_marker)]
    fixture = Path("tools/stacked-total-render/fixture.js").read_text()
    # Preserve the existing generated E2E scene-capture helper; no private accessor is copied.
    replacement = prefix + "\n" + capture + "\n" + fixture
    (destination / (EXAMPLE + "main.js")).write_text(replacement)
    if sha256((destination / UMD).read_bytes()) != expected["umd"]:
        raise RuntimeError("Runtime bundle changed while installing fixture")
    build_root = Path("tmp/stacked-total-render/builds") / role
    runtime_build = json.loads((build_root / "build.json").read_text())
    pinned = {"base": "fd652e876a2b059924848a2177c82e67d6752327", "head": "52f45beae1fd50b3a23b678219f5d1b81ffea509"}
    assert runtime_build["source"] == pinned[role]
    actual_bundle = (build_root / "ag-charts-enterprise.js").read_bytes()
    assert sha256(actual_bundle) == runtime_build["bundleSha256"]
    (destination / UMD).write_bytes(actual_bundle)
    receipt = {
        "role": role,
        "source": runtime_build["source"],
        "runtimeBuild": runtime_build,
        "scaffoldSource": expected["source"],
        "originalBuildRun": 43726854766,
        "archiveCommit": EVIDENCE,
        "archiveSha256": expected["zip"],
        "filesBeforeFixtureInstallation": retained,
        "fixtureSourceSha256": sha256(fixture.encode()),
        "installedMainSha256": sha256(replacement.encode()),
        "sourceBuiltRuntimeUnmodified": True,
        "note": "Archived generated HTML/CSS/capture and benchmark helpers are verified scaffolding. The runtime is replaced by the directly pinned official source build, with no instrumentation or runtime edits.",
    }
    (REPORTS / (role + "-build-receipt.json")).write_text(json.dumps(receipt, indent=2) + "\n")
    print(json.dumps({"prepared": role, "source": runtime_build["source"], "umdSha256": runtime_build["bundleSha256"]}), flush=True)
    return receipt


with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
    receipts = list(pool.map(prepare, ["base", "head"]))
(REPORTS / "build-receipts.json").write_text(json.dumps(receipts, indent=2) + "\n")
