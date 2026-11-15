export function syntheticData(n, scenario = 'positive') {
  return Array.from({ length: 12 }, (_, month) => {
    const row = { month: `M${month + 1}` }
    for (let i = 0; i < n; i++) {
      let value = (i % 97) + month + 1
      if (scenario !== 'positive') {
        const kind = (i + month) % 13
        if (kind === 0) continue
        if (kind === 1) value = null
        else if (kind === 2) value = -0
        else if (kind === 3) value = 0
        else if (kind % 3 === 0) value = -value
      }
      row[`y${i}`] = value
    }
    return row
  })
}
export function setup(lib, data, n, scenario = 'positive', existingDataSet) {
  const { DataController, DataSet, Logger, keyProperty, valueProperty, groupAccumulativeValueProperty } = lib
  const logger = new Logger()
  const dataset = existingDataSet ?? new DataSet(data, logger)
  const controller = new DataController('standalone', false, undefined, logger)
  const requests = []
  for (let i = 0; i < n; i++) {
    const key = `y${i}`
    const hidden = scenario !== 'positive' && i % 17 === 0
    const visibleProps = hidden ? { forceValue: 0 } : {}
    const groupId = scenario === 'positive' ? 'stack' : `stack-${i % 2}`
    requests.push(controller.request(`series${i}`, dataset, {
      groupByKeys: true, groupByData: false,
      props: [
        keyProperty('month', 'category', { id: 'xValue', allowNullKey: false }),
        valueProperty(key, 'number', { id: 'yValue-raw', invalidValue: null, ...visibleProps }),
        ...groupAccumulativeValueProperty(key, 'normal', {
          id: 'yValue-end', rangeId: 'yValue-range', invalidValue: null, missingValue: 0,
          groupId, separateNegative: true, ...visibleProps,
        }, 'number'),
        ...groupAccumulativeValueProperty(key, 'trailing', {
          id: 'yValue-start', invalidValue: null, missingValue: 0,
          groupId: `${groupId}-trailing`, separateNegative: true, ...visibleProps,
        }, 'number'),
      ],
    }))
  }
  return { controller, requests, dataset }
}
export function serialiseResults(results) {
  return results.map(({ dataModel, processedData }, i) => {
    const scope = { id: `series${i}` }
    const ids = ['yValue-raw', 'yValue-start', 'yValue-end']
    return {
      keys: dataModel.resolveKeysById(scope, 'xValue', processedData),
      columns: ids.map(id => dataModel.resolveColumnById(scope, id, processedData, 'mixed-numeric')),
      domains: ids.map(id => dataModel.getDomain(scope, id, 'value', processedData).domain),
      range: dataModel.getDomain(scope, 'yValue-range', 'aggregate', processedData).domain,
      groups: processedData.groups.map(g => [g.keys, g.validScopes.has(scope.id)]),
    }
  })
}
