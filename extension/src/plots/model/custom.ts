import type { TopLevelSpec } from 'vega-lite'
import { getCustomPlotId } from './collect'
import { Column, ColumnType } from '../../experiments/webview/contract'
import { PLOT_ANCHORS } from '../../cli/dvc/contract'
import { FILE_SEPARATOR } from '../../experiments/columns/constants'

export type CustomPlotsOrderValue = {
  metric: string
  param: string
}

export const removeColumnTypeFromPath = (columnPath: string, type: string) =>
  columnPath.startsWith(type + FILE_SEPARATOR)
    ? columnPath.slice(type.length + 1)
    : columnPath

export const getFullValuePath = (type: string, columnPath: string) =>
  type + FILE_SEPARATOR + columnPath

export const cleanupOldOrderValue = (
  value: { metric: string; param: string } | CustomPlotsOrderValue
): CustomPlotsOrderValue => ({
  metric: removeColumnTypeFromPath(value.metric, ColumnType.METRICS),
  param: removeColumnTypeFromPath(value.param, ColumnType.PARAMS)
})

export const getCustomPlotIds = (
  customPlotVals: CustomPlotsOrderValue[]
): Set<string> => {
  const plotIds: Set<string> = new Set()

  for (const { metric, param } of customPlotVals) {
    plotIds.add(getCustomPlotId(metric, param))
  }

  return plotIds
}

export const getCustomPlotPathsFromColumns = (
  columns: Column[]
): { metrics: string[]; params: string[] } => {
  const metrics = []
  const params = []

  for (const { path, type } of columns) {
    if (type === ColumnType.METRICS) {
      metrics.push(removeColumnTypeFromPath(path, ColumnType.METRICS))
    } else if (type === ColumnType.PARAMS) {
      params.push(removeColumnTypeFromPath(path, ColumnType.PARAMS))
    }
  }
  return { metrics, params }
}

export const getDataType = (type: string) =>
  type === 'number' ? 'quantitative' : 'nominal'

export const getContent = (): TopLevelSpec =>
  ({
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: { values: PLOT_ANCHORS.DATA },
    encoding: {
      color: PLOT_ANCHORS.COLOR,
      x: {
        axis: {
          labelLimit: 75,
          titlePadding: 30
        },
        field: 'param',
        scale: {
          zero: false
        },
        title: PLOT_ANCHORS.X_LABEL,
        type: PLOT_ANCHORS.PARAM_TYPE
      },
      y: {
        axis: {
          labelLimit: 75,
          titlePadding: 30
        },
        field: 'metric',
        scale: {
          zero: false
        },
        title: PLOT_ANCHORS.Y_LABEL,
        type: PLOT_ANCHORS.METRIC_TYPE
      }
    },
    height: 'container',
    layer: [
      {
        encoding: {
          tooltip: [
            {
              field: 'id',
              title: 'id'
            },
            {
              field: 'metric',
              title: PLOT_ANCHORS.Y_LABEL
            },
            {
              field: 'param',
              title: PLOT_ANCHORS.X_LABEL
            }
          ]
        },
        mark: {
          filled: true,
          size: 60,
          type: 'point'
        },
        params: [PLOT_ANCHORS.ZOOM_AND_PAN]
      }
    ],
    width: 'container'
  }) as unknown as TopLevelSpec
