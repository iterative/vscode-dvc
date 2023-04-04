import { VisualizationSpec } from 'react-vega'
import { getCustomPlotId } from './collect'
import { Column, ColumnType } from '../../experiments/webview/contract'
import { FILE_SEPARATOR } from '../../experiments/columns/paths'

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

export const checkForCustomPlotOptions = (
  columns: Column[],
  customPlotOrder: CustomPlotsOrderValue[]
): boolean => {
  const { metrics, params } = getCustomPlotPathsFromColumns(columns)
  const plotIds = getCustomPlotIds(customPlotOrder)

  for (const metric of metrics) {
    for (const param of params) {
      if (!plotIds.has(getCustomPlotId(metric, param))) {
        return true
      }
    }
  }

  return false
}

export const createSpec = (title: string, metric: string, param: string) =>
  ({
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: { name: 'values' },
    encoding: {
      x: {
        field: 'param',
        scale: {
          zero: false
        },
        title: param,
        type: 'quantitative'
      },
      y: {
        field: 'metric',
        scale: {
          zero: false
        },
        title,
        type: 'quantitative'
      }
    },
    height: 'container',
    layer: [
      {
        encoding: {
          tooltip: [
            {
              field: 'expName',
              title: 'name'
            },
            {
              field: 'metric',
              title: metric
            },
            {
              field: 'param',
              title: param
            }
          ]
        },
        mark: {
          type: 'point'
        }
      }
    ],
    width: 'container'
  } as VisualizationSpec)
