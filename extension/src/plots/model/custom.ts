import { VisualizationSpec } from 'react-vega'
import { getCustomPlotId } from './collect'
import { Column, ColumnType } from '../../experiments/webview/contract'
import {
  CheckpointPlot,
  ColorScale,
  CustomPlot,
  CustomPlotType
} from '../webview/contract'
import { FILE_SEPARATOR } from '../../experiments/columns/paths'

export const CHECKPOINTS_PARAM = 'epoch'

export type CustomPlotsOrderValue = {
  type: CustomPlotType.METRIC_VS_PARAM | CustomPlotType.CHECKPOINT
  metric: string
  param: string
}

export const isCheckpointValue = (
  type: CustomPlotType.CHECKPOINT | CustomPlotType.METRIC_VS_PARAM
) => type === CustomPlotType.CHECKPOINT

export const isCheckpointPlot = (plot: CustomPlot): plot is CheckpointPlot =>
  plot.type === CustomPlotType.CHECKPOINT

export const removeColumnTypeFromPath = (columnPath: string, type: string) =>
  columnPath.startsWith(type + FILE_SEPARATOR)
    ? columnPath.slice(type.length + 1)
    : columnPath

export const getFullValuePath = (type: string, columnPath: string) =>
  type + FILE_SEPARATOR + columnPath

export const cleanupOldOrderValue = (
  value: { metric: string; param: string } | CustomPlotsOrderValue
): CustomPlotsOrderValue => ({
  // previous column paths have the "TYPE:" prefix
  metric: removeColumnTypeFromPath(value.metric, ColumnType.METRICS),
  param: removeColumnTypeFromPath(value.param, ColumnType.PARAMS),
  // previous values didn't have a type
  type: (value as CustomPlotsOrderValue).type || CustomPlotType.METRIC_VS_PARAM
})

export const getCustomPlotIds = (
  customPlotVals: CustomPlotsOrderValue[],
  customPlotType: CustomPlotType
): Set<string> => {
  const plotIds: Set<string> = new Set()

  for (const { type, metric, param } of customPlotVals) {
    if (type === customPlotType) {
      plotIds.add(getCustomPlotId(metric, param))
    }
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

export const checkForMetricVsParamPlotOptions = (
  columns: Column[],
  customPlotOrder: CustomPlotsOrderValue[]
): boolean => {
  const { metrics, params } = getCustomPlotPathsFromColumns(columns)
  const plotIds = getCustomPlotIds(
    customPlotOrder,
    CustomPlotType.METRIC_VS_PARAM
  )

  for (const metric of metrics) {
    for (const param of params) {
      if (!plotIds.has(getCustomPlotId(metric, param))) {
        return true
      }
    }
  }

  return false
}

export const checkForCheckpointPlotOptions = (
  columns: Column[],
  customPlotOrder: CustomPlotsOrderValue[]
): boolean => {
  const { metrics } = getCustomPlotPathsFromColumns(columns)
  const plotIds = getCustomPlotIds(customPlotOrder, CustomPlotType.CHECKPOINT)

  return metrics.some(metric => !plotIds.has(getCustomPlotId(metric)))
}

export const checkForCustomPlotOptions = (
  columns: Column[],
  customPlotOrder: CustomPlotsOrderValue[]
) => {
  return (
    checkForCheckpointPlotOptions(columns, customPlotOrder) ||
    checkForMetricVsParamPlotOptions(columns, customPlotOrder)
  )
}

export const createCheckpointSpec = (
  title: string,
  fullTitle: string,
  param: string,
  scale?: ColorScale
): VisualizationSpec =>
  ({
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: { name: 'values' },
    encoding: {
      color: {
        field: 'group',
        legend: { disable: true },
        scale,
        title: 'rev',
        type: 'nominal'
      },
      x: {
        axis: { format: '0d', tickMinStep: 1 },
        field: 'iteration',
        title: param,
        type: 'quantitative'
      },
      y: {
        field: 'y',
        scale: { zero: false },
        title,
        type: 'quantitative'
      }
    },
    height: 'container',
    layer: [
      {
        layer: [
          { mark: { type: 'line' } },
          {
            mark: { type: 'point' },
            transform: [
              {
                filter: { empty: false, param: 'hover' }
              }
            ]
          }
        ]
      },
      {
        encoding: {
          opacity: { value: 0 },
          tooltip: [
            { field: 'group', title: 'name' },
            {
              field: 'y',
              title: fullTitle.slice(Math.max(0, fullTitle.indexOf(':') + 1)),
              type: 'quantitative'
            }
          ]
        },
        mark: { type: 'rule' },
        params: [
          {
            name: 'hover',
            select: {
              clear: 'mouseout',
              fields: ['iteration', 'y'],
              nearest: true,
              on: 'mouseover',
              type: 'point'
            }
          }
        ]
      },
      {
        encoding: {
          color: { field: 'group', scale },
          x: { aggregate: 'max', field: 'iteration', type: 'quantitative' },
          y: {
            aggregate: { argmax: 'iteration' },
            field: 'y',
            type: 'quantitative'
          }
        },
        mark: { stroke: null, type: 'circle' }
      }
    ],
    transform: [
      {
        as: 'y',
        calculate: "format(datum['y'],'.5f')"
      }
    ],
    width: 'container'
  } as VisualizationSpec)

export const createMetricVsParamSpec = (
  title: string,
  metric: string,
  param: string
) =>
  ({
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: { name: 'values' },
    encoding: {
      x: {
        field: 'param',
        title: param,
        type: 'quantitative'
      },
      y: {
        field: 'metric',
        scale: { zero: false },
        title,
        type: 'quantitative'
      }
    },
    height: 'container',
    layer: [
      {
        layer: [
          {
            mark: {
              type: 'line'
            }
          },
          {
            mark: {
              type: 'point'
            },
            transform: [
              {
                filter: {
                  param: 'hover'
                }
              }
            ]
          }
        ]
      },
      {
        encoding: {
          opacity: {
            value: 0
          },
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
          type: 'rule'
        },
        params: [
          {
            name: 'hover',
            select: {
              clear: 'mouseout',
              fields: ['param', 'metric'],
              nearest: true,
              on: 'mouseover',
              type: 'point'
            }
          }
        ]
      }
    ],
    transform: [
      {
        as: 'y',
        calculate: "format(datum['y'],'.5f')"
      }
    ],
    width: 'container'
  } as VisualizationSpec)
