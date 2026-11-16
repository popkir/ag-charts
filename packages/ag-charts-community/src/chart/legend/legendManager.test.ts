import { describe, expect, it } from 'vitest';

import { ReactiveState } from 'ag-charts-core';
import { testLogger } from 'ag-charts-test';

import type { ChartState } from '../chartState';
import type { CategoryLegendDatum } from './legendDatum';
import { LegendManager } from './legendManager';

function datum(seriesId: string, itemId = 'value', extra: Partial<CategoryLegendDatum> = {}): CategoryLegendDatum {
    return {
        legendType: 'category',
        id: seriesId,
        seriesId,
        itemId,
        enabled: true,
        symbol: { marker: {} },
        label: { text: seriesId },
        ...extra,
    };
}

function legend() {
    const chartState = new ReactiveState<ChartState>();
    chartState.setValue('legendData', {});
    chartState.flushChanges();
    return { chartState, manager: new LegendManager({ chartState, logger: testLogger }) };
}

describe('LegendManager batched data updates', () => {
    it('preserves intermediate legend reads, empty-entry insertion order, multi-item toggles and restoration', () => {
        const plain = legend();
        const batched = legend();
        const exercise = ({ manager }: ReturnType<typeof legend>) => {
            const states: unknown[] = [];
            const record = () =>
                states.push(
                    JSON.parse(
                        JSON.stringify({
                            data: manager.getData(),
                            memento: manager.createMemento(),
                            enabled: manager.getSeriesEnabled('a'),
                        })
                    )
                );
            manager.toggleItem(false, 'empty');
            record();
            manager.updateData('a', [datum('a', 'one', { legendItemName: 'shared' }), datum('a', 'two')]);
            record();
            manager.updateData('b', [datum('b', 'one', { legendItemName: 'shared' })]);
            record();
            manager.toggleItem(false, 'a', 'two');
            record();
            manager.toggleItem(false, 'a', undefined, 'shared');
            record();
            manager.restoreMemento('1', '1', [{ seriesId: 'a', itemId: 'one', visible: true }]);
            record();
            manager.updateData('empty', [datum('empty')]);
            record();
            return states;
        };
        const expected = exercise(plain);
        const actual = batched.manager.batchDataUpdates(() => exercise(batched));
        expect(actual).toEqual(expected);
        expect(batched.chartState.getValue('legendData')).toEqual(plain.chartState.getValue('legendData'));
        expect(Object.keys(batched.chartState.getValue('legendData')!)).toEqual(['empty', 'a', 'b']);
    });

    it('preserves previous reactive snapshots, nesting, clearData and partial writes after exceptions', () => {
        const { manager, chartState } = legend();
        manager.updateData('old', [datum('old')]);
        chartState.flushChanges();
        const previous = chartState.getValue('legendData')!;
        Object.freeze(previous);
        const observed: unknown[] = [];
        chartState.observe((get) => observed.push(get('legendData')));
        expect(() =>
            manager.batchDataUpdates(() => {
                manager.clearData();
                manager.batchDataUpdates(() => manager.updateData('new', [datum('new')]));
                expect(manager.getData().map((d) => d.seriesId)).toEqual(['new']);
                throw new Error('intentional test interruption');
            })
        ).toThrow('intentional test interruption');
        expect(Object.keys(previous)).toEqual(['old']);
        chartState.flushChanges('legendData');
        expect(observed).toHaveLength(2);
        expect(Object.keys(chartState.getValue('legendData')!)).toEqual(['new']);
        manager.updateData('after', [datum('after')]);
        expect(manager.getData().map((d) => d.seriesId)).toEqual(['new', 'after']);
    });
});
