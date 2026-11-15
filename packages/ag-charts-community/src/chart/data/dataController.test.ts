import { describe, expect, it, vi } from 'vitest';

import type { LogIssue } from 'ag-charts-core';
import { testLogger } from 'ag-charts-test';

import { range } from './aggregateFunctions';
import { DataController } from './dataController';
import type { DataModelOptions, DatumPropertyDefinition } from './dataModel';
import { DataSet } from './dataSet';
import { groupAccumulativeValueProperty, keyProperty, valueProperty } from './processors';

describe('DataController', () => {
    let controller: DataController;
    let data: Record<string, number>[];

    beforeEach(() => {
        controller = new DataController('standalone', false, undefined, testLogger);
        data = [];
    });

    it('does not compare unrelated value properties when merging many series', async () => {
        const count = 256;
        const dataSet = new DataSet(
            [Object.fromEntries(Array.from({ length: count }, (_, i) => [`y${i}`, i]))],
            testLogger
        );
        const comparison = vi.spyOn(DataController, 'deepEqual');
        try {
            const requests = Array.from({ length: count }, (_, i) =>
                controller.request(`series${i}`, dataSet, { props: [valueProperty(`y${i}`, 'number')] })
            );
            controller.execute(undefined, undefined);
            const results = await Promise.all(requests);

            expect(results[0].processedData.defs.values).toHaveLength(count);
            expect(comparison).not.toHaveBeenCalled();
        } finally {
            comparison.mockRestore();
        }
    });

    it.each([
        [{ missingValue: 0 }, { missingValue: 1 }],
        [{ forceValue: 0 }, { forceValue: 1 }],
        [{ invalidValue: null }, { invalidValue: undefined }],
        [
            { processor: () => (value: unknown) => value },
            { processor: () => (value: unknown) => (typeof value === 'number' ? value * 2 : value) },
        ],
    ])('keeps the full compatibility check for the same property: %o vs %o', async (firstOptions, secondOptions) => {
        const dataSet = new DataSet([{ y: 3 }], testLogger);
        const first = controller.request('first', dataSet, {
            props: [valueProperty('y' as const, 'number', { id: 'value', ...firstOptions })],
        });
        const second = controller.request('second', dataSet, {
            props: [valueProperty('y' as const, 'number', { id: 'value', ...secondOptions })],
        });

        controller.execute(undefined, undefined);
        const [result] = await Promise.all([first, second]);
        expect(result.processedData.defs.values).toHaveLength(2);
    });

    it('keeps identical property names from different datasets separate in a shared model', async () => {
        const props = [
            keyProperty('x' as const, 'category', { id: 'key' }),
            valueProperty('y' as const, 'number', { id: 'value' }),
        ];
        const requests = [3, 9].map((y, i) =>
            controller.request(`series${i}`, new DataSet([{ x: 'A', y }], testLogger), {
                props,
                groupByKeys: true,
                groupByData: false,
            })
        );
        controller.execute(undefined, undefined);
        const results = await Promise.all(requests);
        expect(results[0].processedData).toBe(results[1].processedData);
        for (const [i, value] of [3, 9].entries()) {
            const { dataModel, processedData } = results[i];
            expect(dataModel.resolveColumnById({ id: `series${i}` }, 'value', processedData, 'number')).toEqual([
                value,
            ]);
        }
        expect(results[0].processedData.defs.values).toHaveLength(2);
    });

    it('preserves every aggregate ID and scope when sharing equivalent ranges', async () => {
        const dataSet = new DataSet<Record<string, string | number>>([{ x: 'A', a: 4, b: -7 }], testLogger);
        const requests = ['first', 'second', 'other'].map((id) => {
            const groupId = id === 'other' ? 'b' : 'a';
            return controller.request(id, dataSet, {
                groupByKeys: true,
                props: [
                    keyProperty('x', 'category', { id: 'key' }),
                    valueProperty(groupId, 'number', { id: 'value', groupId }),
                    range(`${id}-range`, groupId),
                    range(`${id}-alias`, groupId),
                ],
            });
        });

        controller.execute(undefined, undefined);
        const results = await Promise.all(requests);
        for (const [i, id] of ['first', 'second', 'other'].entries()) {
            const { dataModel, processedData } = results[i];
            const expected = id === 'other' ? [-7, -7] : [4, 4];
            expect(
                processedData.domain.aggValues?.[dataModel.resolveProcessedDataIndexById({ id }, `${id}-range`)]
            ).toEqual(expected);
            expect(
                processedData.domain.aggValues?.[dataModel.resolveProcessedDataIndexById({ id }, `${id}-alias`)]
            ).toEqual(expected);
            expect(dataModel.resolveProcessedDataIndexById({ id }, `${id}-range`)).toBe(id === 'other' ? 1 : 0);
        }
        expect(results[0].processedData.domain.aggValues).toHaveLength(2);
    });

    it('preserves stacked ranges across visibility changes and cached transactions', async () => {
        const dataSet = new DataSet<Record<string, string | number>>(
            [
                { x: 'A', a: 2, b: 3 },
                { x: 'B', a: -4, b: 5 },
            ],
            testLogger,
            'x'
        );
        let cache: ReturnType<DataController['execute']> | undefined;
        const processStack = async (hidden = false) => {
            const next = new DataController('standalone', false, undefined, testLogger);
            const requests = (['a', 'b'] as const).map((key) => {
                const visibleProps = hidden && key === 'b' ? { forceValue: 0 } : {};
                return next.request(key, dataSet, {
                    groupByKeys: true,
                    groupByData: false,
                    props: [
                        keyProperty('x', 'category', { id: 'key' }),
                        ...groupAccumulativeValueProperty(
                            key,
                            'normal',
                            { id: 'end', rangeId: 'range', groupId: 'stack', separateNegative: true, ...visibleProps },
                            'number'
                        ),
                        ...groupAccumulativeValueProperty(
                            key,
                            'trailing',
                            { id: 'start', groupId: 'trailing', separateNegative: true, ...visibleProps },
                            'number'
                        ),
                    ],
                });
            });
            cache = next.execute(cache, undefined);
            const results = await Promise.all(requests);
            const { dataModel, processedData } = results[0];
            return {
                keys: dataModel.resolveKeysById({ id: 'a' }, 'key', processedData),
                ends: ['a', 'b'].map((id) => dataModel.resolveColumnById({ id }, 'end', processedData, 'number')),
                ranges: ['a', 'b'].map(
                    (id) => processedData.domain.aggValues?.[dataModel.resolveProcessedDataIndexById({ id }, 'range')]
                ),
            };
        };

        expect(await processStack()).toEqual({
            keys: ['A', 'B'],
            ends: [
                [2, -4],
                [5, 5],
            ],
            ranges: [
                [-4, 5],
                [-4, 5],
            ],
        });
        expect(await processStack(true)).toEqual({
            keys: ['A', 'B'],
            ends: [
                [2, -4],
                [2, 0],
            ],
            ranges: [
                [-4, 2],
                [-4, 2],
            ],
        });
        dataSet.addTransaction({ update: [{ x: 'A', a: 7, b: -1 }], append: [{ x: 'C', a: -2, b: -3 }] });
        expect(await processStack()).toEqual({
            keys: ['A', 'B', 'C'],
            ends: [
                [7, -4, -2],
                [-1, 5, -5],
            ],
            ranges: [
                [-5, 7],
                [-5, 7],
            ],
        });
        dataSet.addTransaction({ remove: [dataSet.data[1]], prepend: [{ x: 'D', a: 1, b: 2 }] });
        expect(await processStack()).toEqual({
            keys: ['D', 'A', 'C'],
            ends: [
                [1, 7, -2],
                [3, -1, -5],
            ],
            ranges: [
                [-5, 7],
                [-5, 7],
            ],
        });
    });

    it('should merge compatible requests with identical definitions', async () => {
        const def = {
            props: [
                {
                    id: 'keyProp1-key',
                    property: 'keyProp1',
                    type: 'key' as const,
                    valueType: 'category' as const,
                },
                {
                    property: 'valueProp1',
                    type: 'value' as const,
                    valueType: 'range' as const,
                },
            ],
        };
        const dataSet = new DataSet(data, testLogger);
        const promise1 = controller.request('test1', dataSet, def);
        const promise2 = controller.request('test2', dataSet, def);

        controller.execute(undefined, undefined);
        const results = await Promise.all([promise1, promise2]);

        expect(results[0]).toEqual(results[1]);
        expect(results[0].processedData.defs.keys).toHaveLength(1);
        expect(results[0].processedData.defs.values).toHaveLength(1);
    });

    it('should merge compatible requests with different ids', async () => {
        const dataSet = new DataSet(data, testLogger);
        const promise1 = controller.request('test1', dataSet, {
            props: [
                {
                    id: 'keyProp1-key',
                    property: 'keyProp1',
                    type: 'key',
                    valueType: 'category',
                },
                {
                    property: 'valueProp1',
                    type: 'value',
                    valueType: 'range',
                },
            ],
        });

        const promise2 = controller.request('test2', dataSet, {
            props: [
                {
                    id: 'keyProp2-key',
                    property: 'keyProp1',
                    type: 'key',
                    valueType: 'category',
                },
                {
                    property: 'valueProp1',
                    type: 'value',
                    valueType: 'range',
                },
            ],
        });

        controller.execute(undefined, undefined);
        const results = await Promise.all([promise1, promise2]);

        expect(results[0]).toEqual(results[1]);
        expect(results[0].processedData.defs.keys).toHaveLength(1);
        expect(results[0].processedData.defs.values).toHaveLength(1);
    });

    it('should not merge incompatible requests', async () => {
        const promise1 = controller.request('test1', new DataSet(data, testLogger), {
            props: [
                {
                    id: 'keyProp1-key',
                    property: 'keyProp1',
                    type: 'key',
                    valueType: 'category',
                },
                {
                    property: 'valueProp1',
                    type: 'value',
                    valueType: 'range',
                },
            ],
        });

        const promise2 = controller.request('test2', new DataSet(data, testLogger), {
            props: [
                {
                    id: 'keyProp2-key',
                    property: 'keyProp2',
                    type: 'key',
                    valueType: 'category',
                },
                {
                    property: 'valueProp1',
                    type: 'value',
                    valueType: 'range',
                },
            ],
        });

        controller.execute(undefined, undefined);
        const results = await Promise.all([promise1, promise2]);

        expect(results[0]).not.toEqual(results[1]);
        expect(results[0].processedData.defs.keys).toHaveLength(1);
        expect(results[0].processedData.defs.values).toHaveLength(1);
        expect(results[1].processedData.defs.keys).toHaveLength(1);
        expect(results[1].processedData.defs.values).toHaveLength(1);
    });

    it('should merge compatible requests', async () => {
        const dataSet = new DataSet(data, testLogger);
        const promise1 = controller.request('test1', dataSet, {
            props: [
                {
                    id: 'keyProp1-key',
                    property: 'keyProp1',
                    type: 'key',
                    valueType: 'category',
                },
                {
                    id: 'valueProp1-key',
                    property: 'valueProp1',
                    type: 'value',
                    valueType: 'range',
                },
                {
                    id: 'valueProp2-key',
                    property: 'valueProp2',
                    type: 'value',
                    valueType: 'range',
                },
            ],
        });

        const promise2 = controller.request('test2', dataSet, {
            props: [
                {
                    id: 'keyProp1-key',
                    property: 'keyProp1',
                    type: 'key',
                    valueType: 'category',
                },
                {
                    id: 'valueProp1-key',
                    property: 'valueProp2',
                    type: 'value',
                    valueType: 'range',
                },
                {
                    id: 'valueProp2-key',
                    property: 'valueProp1',
                    type: 'value',
                    valueType: 'range',
                },
            ],
        });

        controller.execute(undefined, undefined);
        const results = await Promise.all([promise1, promise2]);

        const test1ValueProp1DataIdx = results[0].dataModel.resolveProcessedDataDefById(
            { id: 'test1' },
            'valueProp1-key'
        );

        const test2ValueProp1DataIdx = results[0].dataModel.resolveProcessedDataDefById(
            { id: 'test2' },
            'valueProp1-key'
        );

        expect(results[0]).toEqual(results[1]);

        expect(test1ValueProp1DataIdx).not.toEqual(test2ValueProp1DataIdx);

        expect(results[0].processedData.defs.keys).toHaveLength(1);
        expect(results[0].processedData.defs.values).toHaveLength(2);

        expect(results[0].processedData.defs.keys[0].idsMap?.size).toEqual(2);
        expect(results[0].processedData.defs.keys[0].idsMap).toEqual(
            new Map([
                ['test1', new Set(['keyProp1-key'])],
                ['test2', new Set(['keyProp1-key'])],
            ])
        );

        expect(results[0].processedData.defs.values[0].idsMap?.size).toEqual(2);
        expect(results[0].processedData.defs.values[0].idsMap).toEqual(
            new Map([
                ['test1', new Set(['valueProp1-key'])],
                ['test2', new Set(['valueProp2-key'])],
            ])
        );

        expect(results[0].processedData.defs.values[1].idsMap?.size).toEqual(2);
        expect(results[0].processedData.defs.values[1].idsMap).toEqual(
            new Map([
                ['test1', new Set(['valueProp2-key'])],
                ['test2', new Set(['valueProp1-key'])],
            ])
        );
    });

    it('should not leak scopes', async () => {
        data = [
            { keyProp1: 2020, valueProp1: 100 },
            { keyProp1: 2021, valueProp1: 200 },
            { keyProp1: 2022, valueProp1: 300 },
        ];

        const promise1 = controller.request('test1', new DataSet(data, testLogger), {
            props: [
                {
                    id: 'keyProp1-key',
                    property: 'keyProp1',
                    type: 'key',
                    valueType: 'category',
                },
                {
                    id: 'valueProp1-key',
                    property: 'valueProp1',
                    type: 'value',
                    valueType: 'range',
                },
            ],
        });

        controller.execute(undefined, undefined);
        const results = await Promise.all([promise1]);

        expect(results[0].processedData.keys).toEqual([new Map([['test1', [2020, 2021, 2022]]])]);
        expect(results[0].processedData.columns).toEqual([[100, 200, 300]]);
    });

    it('reports a key missing from every datum through the logger as a warning', async () => {
        const issues: LogIssue[] = [];
        const stop = testLogger.onIssue((issue) => issues.push(issue));
        const rows: Record<string, unknown>[] = [{ keyProp1: '2020' }];
        const promise = controller.request('test1', new DataSet(rows, testLogger), {
            props: [
                { id: 'keyProp1-key', property: 'keyProp1', type: 'key', valueType: 'category' },
                { id: 'valueProp1-key', property: 'valueProp1', type: 'value', valueType: 'range' },
            ],
        });

        controller.execute(undefined, undefined);
        await promise;
        stop();

        expect(issues).toHaveLength(1);
        expect(issues[0].severity).toBe('warning');
        expect(issues[0].message).toContain("the key 'valueProp1' was not found");
    });

    describe('with multiple data sources', () => {
        it('should extract scoped data for each request with shared scopes', async () => {
            const data1 = [
                { keyProp1: '2020', valueProp1: 100 },
                { keyProp1: '2021', valueProp1: 200 },
                { keyProp1: '2022', valueProp1: 300 },
            ];
            const data2 = [
                { keyProp1: '2020', valueProp1: 40 },
                { keyProp1: '2021', valueProp1: 50 },
                { keyProp1: '2022', valueProp1: 60 },
            ];

            const def: DataModelOptions<'keyProp1' | 'valueProp1', any, false> = {
                props: [
                    {
                        id: 'keyProp1-key',
                        property: 'keyProp1',
                        type: 'key',
                        valueType: 'category',
                    },
                    {
                        id: 'valueProp1-key',
                        property: 'valueProp1',
                        type: 'value',
                        valueType: 'range',
                    },
                ],
            };

            const promise1 = controller.request('test1', new DataSet(data1, testLogger), def);
            const promise2 = controller.request('test2', new DataSet(data2, testLogger), def);

            controller.execute(undefined, undefined);
            const results = await Promise.all([promise1, promise2]);

            expect(results.length).toEqual(2);
            expect(results[0].processedData.columns.map((c) => c[0])).toEqual([100]);
            expect(results[1].processedData.columns.map((c) => c[0])).toEqual([40]);
        });

        it('should extract scoped data for each request with unique scopes', async () => {
            const data1 = [
                { keyProp1: '2020', valueProp1: 100 },
                { keyProp1: '2021', valueProp1: 200 },
                { keyProp1: '2022', valueProp1: 300 },
            ];
            const data2 = [
                { keyProp1: '2020', valueProp1: 40 },
                { keyProp1: '2021', valueProp1: 50 },
                { keyProp1: '2022', valueProp1: 60 },
            ];

            const promise1 = controller.request('test1', new DataSet(data1, testLogger), {
                props: [
                    {
                        id: 'keyProp1-key',
                        property: 'keyProp1',
                        type: 'key',
                        valueType: 'category',
                    },
                    {
                        id: 'valueProp1-key',
                        property: 'valueProp1',
                        type: 'value',
                        valueType: 'range',
                    },
                ],
            });

            const promise2 = controller.request('test2', new DataSet(data2, testLogger), {
                props: [
                    {
                        id: 'keyProp1-key',
                        property: 'keyProp1',
                        type: 'key',
                        valueType: 'category',
                    },
                    {
                        id: 'valueProp1-key',
                        property: 'valueProp1',
                        type: 'value',
                        valueType: 'range',
                    },
                ],
            });

            controller.execute(undefined, undefined);
            const results = await Promise.all([promise1, promise2]);

            expect(results[0].processedData.columns.map((c) => c[0])).toEqual([100]);
            expect(results[1].processedData.columns.map((c) => c[0])).toEqual([40]);
        });

        it('should extract scoped data for each request and not include given properties', async () => {
            const data1 = [{ valueProp1: 100 }, { valueProp1: 200 }, { valueProp1: 300 }];
            const data2 = [{ valueProp1: 40 }, { valueProp1: 50 }, { valueProp1: 60 }];

            const promise1 = controller.request('test1', new DataSet(data1, testLogger), {
                props: [
                    {
                        id: 'valueProp1-key1',
                        property: 'valueProp1',
                        type: 'value',
                        valueType: 'category',
                    },
                    {
                        id: 'valueProp1-key2',
                        property: 'valueProp1',
                        type: 'value',
                        valueType: 'category',
                        includeProperty: false,
                        processor: () => (value: any) => `key2 ${value}`,
                    },
                ],
            });

            const promise2 = controller.request('test2', new DataSet(data2, testLogger), {
                props: [
                    {
                        id: 'valueProp1-key1',
                        property: 'valueProp1',
                        type: 'value',
                        valueType: 'category',
                    },
                    {
                        id: 'valueProp1-key2',
                        property: 'valueProp1',
                        type: 'value',
                        valueType: 'category',
                        includeProperty: false,
                        processor: () => (value: any) => `key2 ${value}`,
                    },
                ],
            });

            controller.execute(undefined, undefined);
            const results = await Promise.all([promise1, promise2]);

            expect(results[0].processedData.columns.map((c) => c[0])).toEqual([100, 'key2 100']);
            expect(results[1].processedData.columns.map((c) => c[0])).toEqual([40, 'key2 40']);
        });

        it('should extract scoped grouped data and not leak scopes', async () => {
            const data1 = [
                { keyProp1: '2020', valueProp1: 100 },
                { keyProp1: '2021', valueProp1: 200 },
                { keyProp1: '2022', valueProp1: 300 },
            ];
            const data2 = [
                { keyProp1: '2020', valueProp1: 40 },
                { keyProp1: '2021', valueProp1: 50 },
                { keyProp1: '2022', valueProp1: 60 },
            ];

            const def = {
                groupByKeys: true,
                props: [
                    {
                        type: 'key',
                        property: 'keyProp1' as const,
                        valueType: 'category',
                    },
                    {
                        property: 'valueProp1' as const,
                        type: 'value',
                        valueType: 'range',
                        groupId: 'valueProp1',
                        id: undefined,
                    },
                ] satisfies DatumPropertyDefinition<any>[],
            };

            const promise1 = controller.request('test1', new DataSet(data1, testLogger), def);
            const promise2 = controller.request('test2', new DataSet(data2, testLogger), def);

            controller.execute(undefined, undefined);
            const results = await Promise.all([promise1, promise2]);

            expect(results[0].processedData.columns).toEqual([[100, 200, 300]]);
            expect(results[1].processedData.columns).toEqual([[40, 50, 60]]);
        });
    });

    describe('deepEqual', () => {
        it('should correctly compare primitive values', () => {
            expect(DataController.deepEqual(1, 1)).toBe(true);
            expect(DataController.deepEqual('test', 'test')).toBe(true);
            expect(DataController.deepEqual(true, false)).toBe(false);
        });

        it('should correctly compare arrays', () => {
            expect(DataController.deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
            expect(DataController.deepEqual(['a', 'b', 'c'], ['a', 'b', 'c'])).toBe(true);
            expect(DataController.deepEqual([1, 2, 3], [3, 2, 1])).toBe(false);
        });

        it('should correctly compare simple objects', () => {
            expect(DataController.deepEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
            expect(DataController.deepEqual({ a: 'test', b: 'check' }, { a: 'test', b: 'check' })).toBe(true);
            expect(DataController.deepEqual({ a: 1, b: 2 }, { a: 2, b: 1 })).toBe(false);
        });

        it('should correctly compare nested objects', () => {
            const obj1 = { a: 1, b: { c: 2, d: 3 } };
            const obj2 = { a: 1, b: { c: 2, d: 3 } };
            const obj3 = { a: 1, b: { c: 3, d: 2 } };
            expect(DataController.deepEqual(obj1, obj2)).toBe(true);
            expect(DataController.deepEqual(obj1, obj3)).toBe(false);
        });

        it('should correctly compare objects containing arrays', () => {
            const obj1 = { a: [1, 2, 3], b: 'test' };
            const obj2 = { a: [1, 2, 3], b: 'test' };
            const obj3 = { a: [3, 2, 1], b: 'test' };
            expect(DataController.deepEqual(obj1, obj2)).toBe(true);
            expect(DataController.deepEqual(obj1, obj3)).toBe(false);
        });

        it('should correctly ignore specified keys when comparing objects', () => {
            const obj1 = { id: 123, name: 'John', type: 'admin' };
            const obj2 = { id: 456, name: 'John', type: 'user' };
            expect(DataController.deepEqual(obj1, obj2)).toBe(true); // assuming id and type are in skipKeys
        });
    });
});
