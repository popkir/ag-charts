import { pathToFileURL } from 'node:url'
import { appendFileSync } from 'node:fs'
import { setup, syntheticData } from './fixture.mjs'
const [variant, size = '100', scenario = 'positive', iterations = '3'] = process.argv.slice(2)
if (!['baseline', 'candidate'].includes(variant)) throw new Error('Expected an uninstrumented baseline or candidate module')
const lib = await import(pathToFileURL(`${process.cwd()}/tmp/stacked-perf/${variant}.mjs`))
let mergeMs = 0
let groupBatchesMs = 0
const merge = lib.DataController.prototype.mergeRequested
lib.DataController.prototype.mergeRequested = function (...args) {
  const t = performance.now(); const result = merge.apply(this, args); mergeMs += performance.now() - t; return result
}
const group = lib.DataGrouper.prototype.groupBatches
lib.DataGrouper.prototype.groupBatches = function (...args) {
  const t = performance.now(); const result = group.apply(this, args); groupBatchesMs += performance.now() - t; return result
}
async function run(n, iteration) {
  const data = syntheticData(n, scenario)
  global.gc()
  const t = performance.now()
  const { controller, requests } = setup(lib, data, n, scenario)
  const requestMs = performance.now() - t
  global.gc()
  const before = process.memoryUsage()
  mergeMs = 0; groupBatchesMs = 0
  const start = performance.now()
  const cache = controller.execute(undefined, undefined)
  const executeMs = performance.now() - start
  const results = await Promise.all(requests)
  const transient = process.memoryUsage()
  global.gc()
  const retained = process.memoryUsage()
  if (results.length !== n || cache[0].processedData.columns.length !== n * 3) throw new Error('incomplete processing')
  return { variant, series: n, months: 12, scenario, iteration, requestMs, executeMs, mergeMs, groupBatchesMs,
    heapDeltaBytes: transient.heapUsed - before.heapUsed, retainedHeapDeltaBytes: retained.heapUsed - before.heapUsed,
    rssBytes: retained.rss, processMaxRssKiB: process.resourceUsage().maxRSS,
    aggregates: cache[0].opts.props.filter(p => p.type === 'aggregate').length, node: process.version }
}
await run(32, -1)
for (let i = 0; i < Number(iterations); i++) {
  const result = await run(Number(size), i)
  appendFileSync('tmp/stacked-perf/measurements.jsonl', `${JSON.stringify(result)}\n`)
  console.log(JSON.stringify(result))
}
