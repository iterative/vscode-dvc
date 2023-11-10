import { TopLevelSpec } from 'vega-lite'
import { getCustomPlotId } from './collect'
import { Column, ColumnType } from '../../experiments/webview/contract'
import { FILE_SEPARATOR } from '../../experiments/columns/constants'
import { ColorScale } from '../webview/contract'

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

const getSpecDataType = (type: string) =>
  type === 'number' ? 'quantitative' : 'nominal'

export const createSpec = (
  metric: string,
  param: string,
  metricType: string,
  paramType: string,
  colorScale: ColorScale
) =>
  ({
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: { name: 'values' },
    encoding: {
      color: { field: 'id', legend: null, scale: colorScale },
      x: {
        axis: {
          labelLimit: 75,
          titlePadding: 30
        },
        field: 'param',
        scale: {
          zero: false
        },
        title: param,
        type: getSpecDataType(paramType)
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
        title: metric,
        type: getSpecDataType(metricType)
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
              title: metric
            },
            {
              field: 'param',
              title: param
            }
          ]
        },
        mark: {
          filled: true,
          size: 60,
          type: 'point'
        }
      }
    ],
    width: 'container'
  }) as TopLevelSpec
