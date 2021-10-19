import React, { useMemo } from 'react'
import { ParamOrMetric } from 'dvc/src/experiments/webview/contract'
import { VegaLite, VisualizationSpec } from 'react-vega'
import { splitParamOrMetricPath } from 'dvc/src/experiments/paramsAndMetrics/paths'
import { Config, LegendConfig } from 'vega'
import { PlotsData, PlotItem } from './App'

const createSpec = ({ path, name }: ParamOrMetric): VisualizationSpec => {
  const yField = splitParamOrMetricPath(path)
    .map(segment => segment.replace(/\./g, '\\$&'))
    .join('.')
  const xField = 'iteration'
  const colorField = 'experimentDisplayName'
  return {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: { name: 'items' },
    encoding: { x: { field: xField, type: 'nominal' } },
    height: 300,
    layer: [
      {
        encoding: {
          color: { field: colorField, type: 'nominal' },
          y: { field: yField, title: name, type: 'quantitative' }
        },
        layer: [
          { mark: 'line' },
          {
            mark: 'point',
            transform: [{ filter: { empty: false, param: 'hover' } }]
          }
        ]
      },
      {
        encoding: {
          opacity: {
            condition: { empty: false, param: 'hover', value: 0.3 },
            value: 0
          }
        },
        mark: { tooltip: true, type: 'rule' },
        params: [
          {
            name: 'hover',
            select: {
              clear: 'mouseout',
              fields: [xField],
              nearest: true,
              on: 'mouseover',
              type: 'point'
            }
          }
        ],
        transform: [{ groupby: [xField], pivot: colorField, value: yField }]
      }
    ],
    width: 400
  }
}

const foregroundColor = `var(--vscode-foreground)`
const backgroundColor = 'var(--vscode-editor-background)'
const config: Config = {
  axis: {
    domain: false,
    gridOpacity: 0.25,
    tickColor: foregroundColor,
    titleColor: foregroundColor
  },
  background: backgroundColor,
  legend: {
    disabled: true
  } as LegendConfig,
  padding: 10,
  style: {
    cell: {
      stroke: foregroundColor
    },
    'group-title': {
      fill: foregroundColor,
      stroke: foregroundColor
    },
    'guide-label': {
      fill: foregroundColor,
      stroke: foregroundColor
    },
    'guide-title': {
      fill: foregroundColor,
      stroke: foregroundColor
    },
    rule: {
      fill: foregroundColor,
      stroke: foregroundColor
    }
  }
}

const Plot = ({
  items,
  yMetric
}: {
  items: PlotItem[]
  yMetric: ParamOrMetric
}) => {
  const spec = createSpec(yMetric)

  return (
    <VegaLite
      actions={false}
      config={config}
      spec={spec}
      data={{ items }}
      renderer="svg"
    />
  )
}

const collectLeafMetrics = (columns?: ParamOrMetric[]): ParamOrMetric[] => {
  const leafMetrics: ParamOrMetric[] = []
  columns?.forEach(column => {
    if (column.group === 'metrics' && !column.hasChildren) {
      leafMetrics.push(column)
    }
  })
  return leafMetrics
}

const Plots = ({ plotsData }: { plotsData?: PlotsData }) => {
  const leafMetrics = useMemo(
    () => collectLeafMetrics(plotsData?.columns),
    [plotsData]
  )

  if (!plotsData) {
    return null
  }

  const { items } = plotsData

  return (
    <>
      {leafMetrics.map(leafMetric => (
        <Plot
          items={items}
          yMetric={leafMetric}
          key={`plot-${leafMetric.path}`}
        />
      ))}
    </>
  )
}
export default Plots
