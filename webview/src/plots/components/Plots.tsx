import React, { useEffect, useMemo, useState } from 'react'
import { ParamOrMetric } from 'dvc/src/experiments/webview/contract'
import { VegaLite, VisualizationSpec } from 'react-vega'
import { splitParamOrMetricPath } from 'dvc/src/experiments/paramsAndMetrics/paths'
import { Config } from 'vega'
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

const createConfig = (): Config => {
  const foregroundColor = `var(--vscode-foreground)`
  const backgroundColor = 'var(--vscode-editor-background)'
  return {
    axis: {
      domain: false,
      gridOpacity: 0.25,
      tickColor: foregroundColor,
      titleColor: foregroundColor
    },
    background: backgroundColor,
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
}

const AllPlots = ({
  items,
  yMetric
}: {
  items: PlotItem[]
  yMetric: ParamOrMetric
}) => {
  if (!yMetric) {
    return null
  }
  const config = createConfig()
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

const collectLeafMetrics = (
  columns?: ParamOrMetric[]
): [ParamOrMetric[], Record<string, ParamOrMetric>] => {
  const leafMetrics: ParamOrMetric[] = []
  const leafMetricsByPath: Record<string, ParamOrMetric> = {}
  columns?.forEach(column => {
    if (column.group === 'metrics' && !column.hasChildren) {
      leafMetrics.push(column)
      leafMetricsByPath[column.path] = column
    }
  })
  return [leafMetrics, leafMetricsByPath]
}

const Plots = ({ plotsData }: { plotsData?: PlotsData }) => {
  const [leafMetrics, leafMetricsByPath] = useMemo(
    () => collectLeafMetrics(plotsData?.columns),
    [plotsData]
  )

  const [yMetricPath, setYMetricPath] = useState<string>()

  useEffect(() => {
    if (
      (!yMetricPath || !leafMetricsByPath[yMetricPath]) &&
      leafMetrics.length > 0
    ) {
      setYMetricPath(leafMetrics[0]?.path)
    }
  }, [yMetricPath, leafMetrics, leafMetricsByPath])

  if (!plotsData || !yMetricPath) {
    return null
  }

  const yMetric = leafMetricsByPath[yMetricPath]

  const { items } = plotsData

  return (
    <>
      <div>
        <select
          value={yMetricPath}
          onChange={e => {
            setYMetricPath(e.target.value)
          }}
        >
          {leafMetrics.map((metric, i) => {
            return (
              <option key={`metric-${i}`} value={metric.path}>
                {metric.path}
              </option>
            )
          })}
        </select>
      </div>
      {yMetricPath && <AllPlots items={items} yMetric={yMetric} />}
    </>
  )
}

export default Plots
