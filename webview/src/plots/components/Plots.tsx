import React, { useEffect, useMemo, useState } from 'react'
import {
  RowData,
  ParamOrMetric,
  TableData
} from 'dvc/src/experiments/webview/contract'
import { VegaLite, VisualizationSpec } from 'react-vega'
import { splitParamOrMetricPath } from 'dvc/src/experiments/paramsAndMetrics/paths'

const createSpec = ({ path, name }: ParamOrMetric): VisualizationSpec => {
  return {
    data: { name: 'table' },
    encoding: {
      x: {
        field: 'i',
        title: 'Iteration',
        type: 'nominal'
      },
      y: {
        field: splitParamOrMetricPath(path)
          .map(segment => segment.replace(/\./g, '\\$&'))
          .join('.'),
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
  rows,
  yMetric
}: {
  rows: RowData[]
  yMetric: ParamOrMetric
}) => {
  if (!yMetric) {
    return null
  }
  const spec = createSpec(yMetric)

  return (
    <div>
      {rows.map(branch =>
        branch.subRows?.map((row, i) => {
          return (
            row.subRows && (
              <div key={`table-${i}`}>
                <h2>{row.displayName}</h2>
                <VegaLite
                  spec={spec}
                  data={{
                    table: row.subRows.map(({ params, metrics }, i) => ({
                      i: i + 1,
                      metrics,
                      params
                    }))
                  }}
                />
              </div>
            )
          )
        })
      )}
    </div>
  )
}

const collectLeafMetrics = (
  tableData: TableData,
  leafMetrics: ParamOrMetric[],
  leafMetricsByPath: Record<string, ParamOrMetric>
) => {
  const { columns } = tableData
  for (const column of columns) {
    if (column.group === 'metrics' && !column.hasChildren) {
      leafMetrics.push(column)
      leafMetricsByPath[column.path] = column
    }
  }
}

const Plots = ({ tableData }: { tableData?: TableData }) => {
  const [leafMetrics, leafMetricsByPath] = useMemo(() => {
    const leafMetrics: ParamOrMetric[] = []
    const leafMetricsByPath: Record<string, ParamOrMetric> = {}

    if (tableData) {
      collectLeafMetrics(tableData, leafMetrics, leafMetricsByPath)
    }

    return [leafMetrics, leafMetricsByPath]
  }, [tableData])

  const [yMetricPath, setYMetricPath] = useState<string>()

  useEffect(() => {
    if (!yMetricPath && leafMetrics.length > 0) {
      setYMetricPath(leafMetrics[0]?.path)
    }
  }, [yMetricPath, leafMetrics])

  if (!tableData || !yMetricPath) {
    return null
  }

  const yMetric = leafMetricsByPath[yMetricPath]

  const { rows } = tableData

  return (
    <>
      <div>
        <select
          onBlur={e => {
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
      {yMetricPath && <AllPlots rows={rows} yMetric={yMetric} />}
    </>
  )
}

export default Plots
