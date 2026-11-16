import { describe, expect, it, vi } from 'vitest';

import { SeriesStateManager } from './seriesStateManager';

describe('SeriesStateManager group scale reuse', () => {
    it.each(['category', 'grouped-category', 'unit-time', 'number', 'time'])(
        'matches fresh group scales across state transitions on %s axes',
        (axisType) => {
            const cached = new SeriesStateManager();
            const fresh = new SeriesStateManager();
            const series = [0, 1, 2].map((i) => ({
                internalId: 's' + i,
                type: 'bar',
                visible: true,
                width: undefined as number | undefined,
                seriesGrouping: {
                    groupIndex: i === 2 ? 1 : 0,
                    groupCount: 2,
                    stackIndex: i === 1 ? 1 : 0,
                    stackCount: i === 2 ? 1 : 2,
                },
            }));
            for (const s of series) {
                cached.registerSeries(s);
                fresh.registerSeries(s);
            }
            const axis = { type: axisType, options: { groupPaddingInner: 0.2 } };
            const otherAxis = { type: 'number', options: {} };
            const snapshot = (manager: SeriesStateManager) => {
                const scale = manager.getGroupScale(series[0])!;
                return {
                    domain: [...scale.domain],
                    range: [...scale.range],
                    bandwidth: scale.bandwidth,
                    padding: scale.padding,
                    round: scale.round,
                    items: series.map((s) => ({
                        width: manager.getGroupBandWidth(s),
                        offset: manager.getGroupOffset(s),
                        stack: manager.getStackOffset(s, 4),
                        neighbours: manager.getVisibleStackNeighbours(s),
                        peers: manager.getVisiblePeerGroupIndex(s),
                    })),
                };
            };
            const check = (width = 200, currentAxis: { type: string; options: object } = axis) => {
                // A fresh axis identity forces the original calculation without changing its inputs.
                cached.updateGroupScale(series[0], width, currentAxis);
                fresh.updateGroupScale(series[0], width, { ...currentAxis });
                expect(snapshot(cached)).toEqual(snapshot(fresh));
            };
            check();
            check();
            check(400);
            check(400);
            series[1].visible = false;
            for (const manager of [cached, fresh]) manager.updateSeries(series[1]);
            check();
            series[0].seriesGrouping.groupIndex = 2;
            series[0].width = 13;
            for (const manager of [cached, fresh]) manager.updateSeries(series[0]);
            check();
            axis.options.groupPaddingInner = 0;
            check();
            check(120, otherAxis);
            check(120);
            check(120);
            for (const manager of [cached, fresh]) manager.getGroupScale(series[0])!.paddingInner = 0.75;
            check();
            for (const manager of [cached, fresh]) manager.deregisterSeries(series[2]);
            check();
            for (const s of series) {
                s.visible = false;
                for (const manager of [cached, fresh]) manager.updateSeries(s);
            }
            check();
        }
    );

    it('reuses an unchanged scale after redundant series updates and invalidates changed grouping', () => {
        const manager = new SeriesStateManager();
        const series = {
            internalId: 'series',
            type: 'bar',
            visible: true,
            seriesGrouping: { groupIndex: 0, groupCount: 1, stackIndex: 0, stackCount: 1 },
        };
        const axis = { type: 'category', options: { groupPaddingInner: 0.2 } };
        manager.registerSeries(series);
        manager.updateGroupScale(series, 100, axis);
        const scale = manager.getGroupScale(series)!;
        const update = vi.spyOn(scale, 'update');
        manager.updateSeries(series);
        manager.updateGroupScale(series, 100, axis);
        expect(update).not.toHaveBeenCalled();
        series.seriesGrouping.groupIndex = 2;
        manager.updateSeries(series);
        manager.updateGroupScale(series, 100, axis);
        expect(update).toHaveBeenCalledTimes(1);
        expect(scale.domain).toEqual(['2-0']);
    });
});
