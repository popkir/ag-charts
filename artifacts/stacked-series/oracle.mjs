import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'
import { writeFileSync } from 'node:fs'
import { setup, syntheticData, serialiseResults } from './fixture.mjs'
const lib = await import(pathToFileURL(`${process.cwd()}/tmp/stacked-perf/candidate.mjs`))
const receipts = []
for (const scenario of ['positive', 'mixed']) {
  const n = 7293
  const data = syntheticData(n, scenario)
  const { controller, requests } = setup(lib, data, n, scenario)
  controller.execute(undefined, undefined)
  const results = serialiseResults(await Promise.all(requests))
  const totals = Array.from({length:12}, () => [[0,0], [0,0]])
  const groupExtents = [[Infinity,-Infinity], [Infinity,-Infinity]]
  const expectedEnds = []
  let checked = 0
  for (let i=0; i<n; i++) {
    const hidden = scenario !== 'positive' && i % 17 === 0
    const group = scenario === 'positive' ? 0 : i % 2
    const expected = [[], [], []]
    for (let m=0; m<12; m++) {
      const key = `y${i}`
      const present = Object.hasOwn(data[m], key)
      const original = data[m][key]
      const negative = original < 0 || Object.is(original, -0)
      const raw = hidden ? (negative ? -0 : 0) : original
      expected[0].push(raw)
      const value = hidden ? raw : (present ? original : 0)
      if (value === null) {
        expected[1].push(null); expected[2].push(null)
      } else {
        const sign = value < 0 || Object.is(value,-0) ? 0 : 1
        const start = totals[m][group][sign]
        const end = start + value
        expected[1].push(start); expected[2].push(end)
        totals[m][group][sign] = end
        groupExtents[group][0] = Math.min(groupExtents[group][0], end)
        groupExtents[group][1] = Math.max(groupExtents[group][1], end)
      }
      checked++
    }
    assert.deepStrictEqual(results[i].keys, data.map(row => row.month))
    assert.deepStrictEqual(results[i].columns, expected, `stack columns ${scenario}, series ${i}`)
    const extents = expected.map(column => {
      const finite = column.filter(value => typeof value === 'number' && Number.isFinite(value))
      return finite.length ? [Math.min(...finite),Math.max(...finite)] : []
    })
    for (let k=0;k<3;k++) {
      assert.equal(results[i].domains[k].length, extents[k].length)
      for (let d=0;d<extents[k].length;d++) assert.ok(results[i].domains[k][d] === extents[k][d], `numeric domain ${scenario}, series ${i}, column ${k}`)
    }
    expectedEnds.push(group)
  }
  for (let i=0; i<n; i++) assert.deepStrictEqual(results[i].range, groupExtents[expectedEnds[i]], `range scope ${i}`)
  receipts.push({scenario,series:n,points:checked,checks:'every x/raw/start/end value, each value domain, every scoped range ID/domain',pass:true})
}
writeFileSync('tmp/stacked-perf/oracle.json',JSON.stringify(receipts,null,2)+'\n')
console.log(JSON.stringify(receipts,null,2))
