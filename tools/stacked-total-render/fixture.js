// This fixture runs in the generated example page after the unchanged upstream helpers.
window.agChartsDebugTimeout = 1_200_000;
window.agChartsDebug = undefined;
// Match the stock benchmark runner: keep the E2E capture helper, disable its theme mutator.
AgCharts.optionsMutationFn = undefined;

async function initialiseManySeriesBenchmark() {
    const seriesCount = Number(new URLSearchParams(window.location.search).get('series') ?? '7293');
    if (!Number.isInteger(seriesCount) || seriesCount < 1 || seriesCount > 7293) {
        throw new Error('Invalid series count');
    }
    const container = document.getElementById('myChart');
    // The example stylesheet stretches its container; fix the DOM box as well as chart dimensions.
    Object.assign(container.style, { width: '1200px', height: '800px', flex: '0 0 auto' });
    const categories = Array.from({ length: 12 }, (_, index) => 'M' + (index + 1));
    const makeOptions = (count) => {
        const data = categories.map((month, categoryIndex) => {
            const row = { month };
            for (let index = 0; index < count; index++) {
                row['y' + index] = (index % 97) + categoryIndex + 1;
            }
            return row;
        });
        return {
            container: document.getElementById('myChart'),
            width: 1200,
            height: 800,
            data,
            animation: { enabled: false },
            legend: { enabled: true },
            theme: { params: { fontFamily: 'Arial, sans-serif' } },
            series: Array.from({ length: count }, (_, index) => ({
                type: 'bar',
                direction: 'vertical',
                xKey: 'month',
                yKey: 'y' + index,
                yName: 'Series ' + index,
                stacked: true,
            })),
        };
    };
    await document.fonts.ready;
    // A separate small chart warms the library; its setup and destruction are not timed.
    const warmup = AgCharts.create(makeOptions(32));
    await warmup.waitForUpdate();
    warmup.destroy();
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    if (typeof window.gc === 'function') window.gc();
    const options = makeOptions(seriesCount);
    window.__renderInputJson = JSON.stringify({
        data: options.data,
        series: options.series,
        animation: options.animation,
        legend: options.legend,
        width: options.width,
        height: options.height,
        theme: options.theme,
    });
    const chartRef = { current: null };
    initBenchmark({
        testCases: [{
            id: 'initial-render',
            label: 'Full many-series initial render',
            variants: [{
                params: { Series: String(seriesCount), Categories: '12', Legend: 'enabled' },
                run: async () => {
                    console.info('MANY_SERIES_RENDER_START', seriesCount);
                    const start = performance.now();
                    // Reuse the exact upstream initial-load helper and public completion promise.
                    const updateCompleteMs = await performInitialLoad(options, chartRef, (opts) => AgCharts.create(opts));
                    const libraryCompleteAt = performance.now();
                    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
                    const twoFramesCompleteMs = performance.now() - start;
                    window.__renderChart = chartRef.current;
                    window.__renderTimings = {
                        updateCompleteMs,
                        twoFramesCompleteMs,
                        extraFrameWaitMs: performance.now() - libraryCompleteAt,
                    };
                    console.info('MANY_SERIES_RENDER_COMPLETE', JSON.stringify(window.__renderTimings));
                    return twoFramesCompleteMs;
                },
            }],
        }],
        config: { updatesPerTest: 1, warmupUpdates: 0, maxCollectionTimeMs: 1_200_000 },
        metadata: {
            scenario: '7293-series-12-categories-positive',
            seriesCount,
            rows: 12,
            points: seriesCount * 12,
            legend: true,
            animation: false,
            chartWidth: 1200,
            chartHeight: 800,
            version: VERSION,
            warmup: 'Separate 32-series chart, then destruction and GC outside timing',
            boundary: 'AgCharts.create through waitForUpdate plus two requestAnimationFrame callbacks',
            libraryBoundary: 'Unmodified upstream performInitialLoad',
        },
    });
}
initialiseManySeriesBenchmark().catch((error) => {
    console.error(error);
    window.__benchmarkError = String(error);
    window.__benchmarkComplete = true;
});
