import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { gzipSync } from 'node:zlib';
import { readCpuSample, readHostInfo, diffContention } from '../benchmark/contention.ts';

const require = createRequire(import.meta.url);
const { chromium } = require(path.resolve('tmp/stacked-total-render/browser-tools/node_modules/playwright'));
const { PNG } = require(path.resolve('tmp/stacked-total-render/browser-tools/node_modules/pngjs'));
const pixelmatch = require(path.resolve('tmp/stacked-total-render/browser-tools/node_modules/pixelmatch'));
const output = path.resolve('tmp/stacked-total-render/results');
fs.mkdirSync(output, { recursive: true });
const sources = {
    base: 'd78787368dc6b5ff88d6dbe144df639d8dd012cf',
    head: '64f85dea3b32382b6ef4169c0f684ee4a21e4e87',
};
const sha = (value) => createHash('sha256').update(value).digest('hex');
const save = (name, value) => fs.writeFileSync(path.join(output, name), JSON.stringify(value, null, 2) + '\n');

async function serve(role) {
    const port = role === 'head' ? 4601 : 4602;
    const process = spawn('node', ['tools/benchmark/serve-static.js', '--dir', 'tmp/stacked-total-render/sites/' + role, '--port', String(port)], { stdio: ['ignore', 'pipe', 'pipe'] });
    const lines = [];
    const ready = new Promise((resolve, reject) => {
        let text = '';
        const timer = setTimeout(() => reject(new Error('Static server did not become ready')), 30_000);
        process.stdout.on('data', (chunk) => {
            text += String(chunk);
            lines.push(String(chunk));
            if (text.includes('SERVING http://localhost:')) {
                clearTimeout(timer);
                resolve('http://localhost:' + port + '/charts');
            }
        });
        process.stderr.on('data', (chunk) => lines.push(String(chunk)));
        process.on('error', reject);
        process.on('exit', (code) => {
            clearTimeout(timer);
            if (code !== 0) reject(new Error('Static server exited: ' + code));
        });
    });
    return { process, ready, lines };
}

function auditScene(scenes, count) {
    assert.equal(scenes.length, 1, 'Expected one actual chart');
    const chart = scenes[0];
    assert.equal(chart.series.length, count, 'Actual series count');
    const categories = Array.from({ length: 12 }, (_, i) => 'M' + (i + 1));
    const geometry = [];
    let zeroSizeRects = 0;
    for (const [index, series] of chart.series.entries()) {
        const rects = [];
        const visit = (node) => {
            if (node.state?.type === 'rect' && categories.includes(node.datumId)) {
                const props = node.state.props;
                for (const key of ['x', 'y', 'width', 'height']) assert(Number.isFinite(props[key]), 'Finite bar geometry');
                assert(props.width >= 0 && props.height >= 0, 'Nonnegative bar size');
                if (props.width === 0 || props.height === 0) zeroSizeRects++;
                rects.push({ datumId: node.datumId, state: node.state });
            }
            for (const child of node.children ?? []) visit(child);
        };
        visit(series.content);
        assert.equal(rects.length, 12, 'Each series must have all 12 bar datums: ' + index);
        assert.deepEqual([...new Set(rects.map((r) => r.datumId))].sort(), [...categories].sort());
        rects.sort((a, b) => categories.indexOf(a.datumId) - categories.indexOf(b.datumId));
        geometry.push(rects);
    }
    return {
        actualSeries: chart.series.length,
        actualBarDatumNodes: count * 12,
        categoriesPerSeries: 12,
        zeroSizeRects,
        geometrySha256: sha(JSON.stringify(geometry)),
        sceneSha256: sha(JSON.stringify(scenes)),
    };
}

async function measure(role, seriesCount, label) {
    const stem = label + '-' + role;
    const messages = [];
    const pageErrors = [];
    const buildReceipt = JSON.parse(fs.readFileSync(path.join(output, role + '-build-receipt.json')));
    assert.equal(buildReceipt.source, sources[role]);
    assert.equal(sha(fs.readFileSync('tmp/stacked-total-render/sites/' + role + '/dev/ag-charts-enterprise/dist/umd/ag-charts-enterprise.js')), buildReceipt.runtimeBuild.bundleSha256);
    console.log(JSON.stringify({ event: 'measurement-start', role, seriesCount, label, at: new Date().toISOString() }));
    const browser = await chromium.launch({
        headless: true,
        args: ['--enable-precise-memory-info', '--js-flags=--expose-gc --max-old-space-size=8192', '--disable-gpu', '--use-gl=swiftshader'],
    });
    const context = await browser.newContext({ viewport: { width: 1280, height: 960 }, deviceScaleFactor: 1 });
    if (label === 'pilot') await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
    const page = await context.newPage();
    let rejectPageError;
    const pageFailure = new Promise((_, reject) => { rejectPageError = reject; });
    // Attach immediately so a page failure never becomes an unhandled Node rejection.
    pageFailure.catch(() => {});
    page.on('pageerror', (error) => {
        pageErrors.push(String(error));
        rejectPageError(error);
    });
    page.on('console', (message) => {
        if (messages.length < 500) messages.push({ type: message.type(), text: message.text() });
        if (message.text().startsWith('MANY_SERIES_')) console.log(role + ': ' + message.text());
    });
    // The archived example mentions Google Fonts. Use only the explicitly selected local font.
    await page.route('**/*', (route) => {
        const url = new URL(route.request().url());
        return ['localhost', '127.0.0.1'].includes(url.hostname) ? route.continue() : route.abort();
    });
    const server = servers[role];
    const baseUrl = await server.ready;
    const before = readCpuSample();
    const navigationStart = Date.now();
    try {
        const response = await page.goto(baseUrl + '/vanilla/benchmarks/examples/high-perf-bar-stacked/?benchmark=true&testCases=initial-render&series=' + seriesCount + '#e2e=true', { waitUntil: 'load', timeout: 600_000 });
        assert(response?.ok(), 'Example navigation succeeded');
        await Promise.race([
            page.waitForFunction(() => window.__benchmarkComplete === true, undefined, { timeout: 1_200_000, polling: 1000 }),
            pageFailure,
        ]);
        const contention = diffContention(before, readCpuSample(), Date.now() - navigationStart);
        const state = await page.evaluate(() => {
            const chart = window.__renderChart;
            if (window.__benchmarkError) return { error: window.__benchmarkError };
            const options = chart.getOptions();
            return {
                timings: window.__renderTimings,
                benchmark: window.__benchmarkResults,
                inputJson: window.__renderInputJson,
                configured: {
                    series: options.series.length,
                    yKeys: options.series.map((s) => s.yKey),
                    rows: options.data.length,
                    animation: options.animation,
                    legend: options.legend,
                    width: options.width,
                    height: options.height,
                },
                chartState: chart.getState(),
                layout: {
                    container: (() => { const r = document.getElementById('myChart').getBoundingClientRect(); return { width: r.width, height: r.height }; })(),
                    wrapper: (() => { const r = document.querySelector('#myChart .ag-charts-wrapper').getBoundingClientRect(); return { width: r.width, height: r.height }; })(),
                    canvases: [...document.querySelectorAll('#myChart canvas')].map((c) => ({ width: c.width, height: c.height, cssWidth: c.style.width, cssHeight: c.style.height })),
                },
            };
        });
        if (state.error) throw new Error(state.error);
        assert.equal(pageErrors.length, 0, 'No browser exceptions');
        assert.equal(state.configured.series, seriesCount);
        assert.equal(state.configured.rows, 12);
        assert.deepEqual(state.configured.yKeys, Array.from({ length: seriesCount }, (_, i) => 'y' + i));
        assert.equal(state.configured.animation.enabled, false);
        assert.equal(state.configured.legend.enabled, true);
        assert.equal(state.chartState.legend.length, seriesCount, 'Every series is present in the actual legend model');
        assert(state.chartState.legend.every((entry) => entry.visible), 'All series remain visible');
        assert.equal(state.benchmark.results.length, 1);
        assert.equal(state.benchmark.results[0].sampleCount, 1);
        const sceneText = await page.evaluate(() => JSON.stringify(window.agE2E.captureScenes()));
        const sceneAudit = auditScene(JSON.parse(sceneText), seriesCount);
        assert.equal(sceneAudit.zeroSizeRects, 0, 'Every positive datum has a nonzero rectangle');
        fs.writeFileSync(path.join(output, stem + '.scene.json.gz'), gzipSync(sceneText));
        fs.writeFileSync(path.join(output, stem + '.input.json.gz'), gzipSync(state.inputJson));
        await page.locator('#myChart .ag-charts-wrapper').screenshot({ path: path.join(output, stem + '.png'), animations: 'disabled', timeout: 60_000 });
        save(stem + '.layout.json', state.layout);
        console.log(JSON.stringify({ event: 'render-layout', role, label, layout: state.layout, sceneAudit }));
        const png = PNG.sync.read(fs.readFileSync(path.join(output, stem + '.png')));
        assert.equal(png.width, 1200);
        assert.equal(png.height, 800);
        const input = JSON.parse(state.inputJson);
        const sums = input.data.map((row, rowIndex) => {
            let total = 0;
            for (let i = 0; i < seriesCount; i++) {
                assert.equal(row['y' + i], (i % 97) + rowIndex + 1);
                total += row['y' + i];
            }
            return total;
        });
        const record = {
            role, source: sources[role], build: JSON.parse(fs.readFileSync(path.join(output, role + '-build-receipt.json'))), label, seriesCount, categories: 12, expectedPoints: seriesCount * 12,
            timestamp: new Date().toISOString(),
            timings: state.timings,
            benchmark: state.benchmark,
            configured: state.configured,
            layout: state.layout,
            chartState: state.chartState,
            inputSha256: sha(state.inputJson),
            expectedCategoryStackTotals: sums,
            sceneAudit,
            screenshot: { width: png.width, height: png.height, sha256: sha(fs.readFileSync(path.join(output, stem + '.png'))) },
            host: readHostInfo(),
            browserVersion: browser.version(),
            viewport: { width: 1280, height: 960, deviceScaleFactor: 1 },
            contention,
            timingInstrumentation: 'No tracing or heap sampling for canonical measurements; trace enabled only for the excluded 32-series pilot',
            completion: 'Unmodified upstream performInitialLoad -> waitForUpdate; then two animation frames',
            runtime: 'Official Nx UMD built directly from the pinned source revision; installed bundle hash verified against its build receipt',
        };
        save(stem + '.json', record);
        console.log(JSON.stringify({ event: 'measurement-complete', role, label, seriesCount, ...state.timings, sceneAudit }));
        return record;
    } catch (error) {
        save(stem + '.failure.json', { role, label, seriesCount, error: String(error), messages, pageErrors });
        throw error;
    } finally {
        save(stem + '.console.json', { messages, pageErrors });
        if (label === 'pilot') await context.tracing.stop({ path: path.join(output, stem + '.trace.zip') }).catch(() => {});
        await browser.close();
    }
}

function comparePair(label) {
    const base = JSON.parse(fs.readFileSync(path.join(output, label + '-base.json')));
    const head = JSON.parse(fs.readFileSync(path.join(output, label + '-head.json')));
    assert.equal(base.inputSha256, head.inputSha256, 'Identical fixture and options');
    assert.equal(base.sceneAudit.sceneSha256, head.sceneAudit.sceneSha256, 'Byte-identical complete scene JSON');
    assert.deepEqual(base.chartState, head.chartState, 'Identical complete public state');
    assert.equal(base.screenshot.sha256, head.screenshot.sha256, 'Byte-identical PNG');
    assert.equal(base.sceneAudit.geometrySha256, head.sceneAudit.geometrySha256, 'Identical complete bar geometry');
    const a = PNG.sync.read(fs.readFileSync(path.join(output, label + '-base.png')));
    const b = PNG.sync.read(fs.readFileSync(path.join(output, label + '-head.png')));
    assert.equal(a.width, b.width);
    assert.equal(a.height, b.height);
    const diff = new PNG({ width: a.width, height: a.height });
    const differentPixels = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0.05, includeAA: true });
    fs.writeFileSync(path.join(output, label + '-diff.png'), PNG.sync.write(diff));
    const result = {
        label,
        differentPixels,
        totalPixels: a.width * a.height,
        geometryIdentical: true,
        rawScenesIdentical: true,
        publicStateIdentical: true,
        pngBytesIdentical: true,
        inputIdentical: true,
        updateRatio: base.timings.updateCompleteMs / head.timings.updateCompleteMs,
        twoFramesRatio: base.timings.twoFramesCompleteMs / head.timings.twoFramesCompleteMs,
    };
    save(label + '-comparison.json', result);
    assert.equal(differentPixels, 0, 'No visual difference between baseline and candidate');
    return result;
}

const args = process.argv.slice(2);
const servers = {};
if (args.includes('--summarise')) {
    const records = ['base', 'head'].flatMap((role) => [1, 2, 3].map((run) => JSON.parse(fs.readFileSync(path.join(output, 'run' + run + '-' + role + '.json')))));
    const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
    const stats = (role, key) => {
        const values = records.filter((r) => r.role === role).map((r) => r.timings[key]);
        return { median: median(values), min: Math.min(...values), max: Math.max(...values), values };
    };
    const comparisons = [1, 2, 3].map((run) => comparePair('run' + run));
    const base = { updateCompleteMs: stats('base', 'updateCompleteMs'), twoFramesCompleteMs: stats('base', 'twoFramesCompleteMs') };
    const head = { updateCompleteMs: stats('head', 'updateCompleteMs'), twoFramesCompleteMs: stats('head', 'twoFramesCompleteMs') };
    const summary = { sources, series: 7293, rows: 12, points: 87516, repeatsPerSide: 3, legend: true, base, head, updateRatio: base.updateCompleteMs.median / head.updateCompleteMs.median, twoFramesRatio: base.twoFramesCompleteMs.median / head.twoFramesCompleteMs.median, comparisons, host: records[0].host, browserVersion: records[0].browserVersion };
    save('summary.json', summary);
    console.log(JSON.stringify(summary));
} else {
    const pilot = args.includes('--pilot');
    const pairIndex = args.indexOf('--pair');
    const pair = pilot ? 0 : Number(args[pairIndex + 1]);
    assert(pilot || (pairIndex >= 0 && [1, 2, 3].includes(pair)));
    const label = pilot ? 'pilot' : 'run' + pair;
    const order = !pilot && pair === 2 ? ['head', 'base'] : ['base', 'head'];
    try {
        servers.base = await serve('base');
        servers.head = await serve('head');
        for (const role of order) await measure(role, pilot ? 32 : 7293, label);
        console.log(JSON.stringify(comparePair(label)));
    } finally {
        for (const role of ['base', 'head']) {
            if (servers[role]) {
                servers[role].process.kill('SIGTERM');
                fs.writeFileSync(path.join(output, label + '-' + role + '.server.log'), servers[role].lines.join(''));
            }
        }
    }
}
