import React, { useEffect, useMemo, useState } from 'react'
import { ParamOrMetric } from 'dvc/src/experiments/webview/contract'
import { VegaLite, VisualizationSpec } from 'react-vega'
import { splitParamOrMetricPath } from 'dvc/src/experiments/paramsAndMetrics/paths'
import { PlotsData, PlotItem } from './App'

const createSpec = ({ path, name }: ParamOrMetric): VisualizationSpec => {
  return {
    data: { name: 'items' },
    encoding: {
      color: {
        field: 'experimentDisplayName',
        title: 'Experiment'
      },
      x: {
        field: 'iteration',
        title: 'Iteration',
        type: 'nominal'
      },
      y: {
        field: splitParamOrMetricPath(path)
          .map(segment => segment.replace(/\./g, '\\$&'))
          .join('.'),
        scale: {
          zero: false
        },
        sort: 'ascending',
        title: name,
        type: 'quantitative'
      }
    },
    height: 200,
    mark: 'line',
    width: 400
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
  const spec = createSpec(yMetric)

  return <VegaLite spec={spec} data={{ items }} />
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
