import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'
import { writeFileSync } from 'node:fs'
import { setup, syntheticData, serialiseResults } from './fixture.mjs'
const cwd = process.cwd()
const baseline = await import(pathToFileURL(`${cwd}/tmp/stacked-perf/baseline.mjs`))
const candidate = await import(pathToFileURL(`${cwd}/tmp/stacked-perf/candidate.mjs`))
async function processFixture(lib, data, n, scenario, cache, dataset) {
  const fixture = setup(lib, data, n, scenario, dataset)
  const next = fixture.controller.execute(cache, undefined)
  const results = await Promise.all(fixture.requests)
  return { ...fixture, cache: next, results, serialised: serialiseResults(results) }
}
const receipts = []
for (const n of [1, 10, 100, 1000]) {
  for (const scenario of ['positive', 'mixed']) {
    const data = syntheticData(n, scenario)
    const b = await processFixture(baseline, data, n, scenario)
    const c = await processFixture(candidate, data, n, scenario)
    assert.deepStrictEqual(c.serialised, b.serialised)
    receipts.push({ check: 'before/after columns, keys, domains, aggregate IDs, group validity', n, scenario, points: 12*n, pass:true })
  }
}
// Run visibility changes, data replacements and transactions through the real controller cache boundary.
for (const lib of [baseline, candidate]) {
  const n = 30
  const data = syntheticData(n, 'positive')
  let current = await processFixture(lib, data, n, 'positive')
  for (const scenario of ['mixed', 'positive']) {
    current = await processFixture(lib, data, n, scenario, current.cache, current.dataset)
    const fresh = await processFixture(lib, data, n, scenario)
    assert.deepStrictEqual(current.serialised, fresh.serialised)
  }
  current.dataset.addTransaction({ append: [{ ...data[0], month: 'M13', y0: -9 }], remove: [data[1]] })
  current = await processFixture(lib, data, n, 'positive', current.cache, current.dataset)
  const fresh = await processFixture(lib, current.dataset.data, n, 'positive')
  assert.deepStrictEqual(current.serialised, fresh.serialised)
  receipts.push({check:'cached visibility changes and append/remove transaction versus fresh processing', variant:lib===baseline?'baseline':'candidate',incremental:current.controller.reprocessedIncrementally,pass:true})
}

// Check the pure shared function separately from the large Number-only stack oracle.
{
  const a = candidate.range('first', 'stack').aggregateFunction
  const b = candidate.range('second', 'other-stack').aggregateFunction
  assert.equal(a, b)
  const big = 9007199254740993n
  const out = [0, 0]
  assert.equal(a([-big, big + 1n], undefined, out), out)
  assert.deepStrictEqual(out, [-big, big + 1n])
  assert.equal(b([], undefined, out), out)
  assert.deepStrictEqual(out, [Infinity, -Infinity])
  assert.notEqual(a([big]), b([big]))
  receipts.push({check:'shared pure range, exact bigint endpoints, independent output and scratch tuple reseeding',pass:true})
}
// Repeated keys and overlapping scopes must not duplicate a shared column's datum indices.
for (const lib of [baseline, candidate]) {
  for (const order of [['scope1', 'scope2'], ['scope2', 'scope1']]) {
    const scopes = [order[0], 'empty', order[1]]
    const dataset = new lib.DataSet([
      { key:'A', a:1, shared:10, b:100 }, { key:'A', a:2, shared:20, b:200 }, { key:'B', a:3, shared:30, b:300 },
    ], new lib.Logger())
    const model = new lib.DataModel({groupByKeys:true,props:[
      lib.keyProperty('key', 'category', {scopes}),
      lib.valueProperty('a','number',{scopes:['scope1']}),
      lib.valueProperty('shared','number',{scopes:['scope1','scope2']}),
      lib.valueProperty('b','number',{scopes:['scope2']}),
    ]},new lib.Logger())
    const result = model.processData(new Map(scopes.map(scope => [scope,dataset])))
    assert.deepStrictEqual(result.columns, [[1,2,3],[10,20,30],[100,200,300]])
    assert.deepStrictEqual(result.groups.map(g=>g.datumIndices), [[[0,1],[0,1],[0,1]],[[1],[1],[1]]])
    assert.deepStrictEqual(result.groups.map(g=>[...g.validScopes]),[scopes,scopes])
  }
  receipts.push({check:'overlapping columns, repeated keys, both scope orders and key-only empty scope',variant:lib===baseline?'baseline':'candidate',pass:true})
}

writeFileSync('tmp/stacked-perf/semantic-check.json', JSON.stringify(receipts,null,2)+'\n')
console.log(JSON.stringify(receipts,null,2))
