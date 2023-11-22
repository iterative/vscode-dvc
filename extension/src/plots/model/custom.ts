import type { TopLevelSpec } from 'vega-lite'
import { getCustomPlotId } from './collect'
import { Column, ColumnType } from '../../experiments/webview/contract'
import {
  PLOT_COLOR_ANCHOR,
  PLOT_DATA_ANCHOR,
  PLOT_METRIC_TYPE_ANCHOR,
  PLOT_X_LABEL_ANCHOR,
  PLOT_Y_LABEL_ANCHOR,
  PLOT_ZOOM_AND_PAN_ANCHOR,
  PLOT_PARAM_TYPE_ANCHOR
} from '../../cli/dvc/contract'
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
    data: { values: PLOT_DATA_ANCHOR },
    encoding: {
      color: PLOT_COLOR_ANCHOR,
      x: {
        axis: {
          labelLimit: 75,
          titlePadding: 30
        },
        field: 'param',
        scale: {
          zero: false
        },
        title: PLOT_X_LABEL_ANCHOR,
        type: PLOT_PARAM_TYPE_ANCHOR
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
        title: PLOT_Y_LABEL_ANCHOR,
        type: PLOT_METRIC_TYPE_ANCHOR
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
              title: PLOT_Y_LABEL_ANCHOR
            },
            {
              field: 'param',
              title: PLOT_X_LABEL_ANCHOR
            }
          ]
        },
        mark: {
          filled: true,
          size: 60,
          type: 'point'
        },
        params: [PLOT_ZOOM_AND_PAN_ANCHOR]
      }
    ],
    width: 'container'
  }) as unknown as TopLevelSpec
