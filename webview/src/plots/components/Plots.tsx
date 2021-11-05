import React from 'react'
import cx from 'classnames'
import { LivePlotData, PlotsData } from 'dvc/src/plots/webview/contract'
import { VegaLite, VisualizationSpec } from 'react-vega'
import { isEmpty } from 'lodash'
import { Config } from 'vega'
import styles from './styles.module.scss'

const createSpec = (title: string): VisualizationSpec => {
  return {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: { name: 'values' },
    encoding: { x: { field: 'x', title: 'iteration', type: 'nominal' } },
    height: 300,
    layer: [
      {
        encoding: {
          color: { field: 'group', legend: null, type: 'nominal' },
          y: { field: 'y', title, type: 'quantitative' }
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
            condition: { empty: false, param: 'hover', value: 0.8 },
            value: 0
          }
        },
        mark: { tooltip: { content: 'data' }, type: 'rule' },
        params: [
          {
            name: 'hover',
            select: {
              clear: 'mouseout',
              fields: ['x'],
              nearest: true,
              on: 'mouseover',
              type: 'point'
            }
          }
        ],
        transform: [{ groupby: ['x'], pivot: 'group', value: 'y' }]
      }
    ],
    width: 400
  }
}

const foregroundColor = 'var(--vscode-foreground)'
const backgroundColor = 'var(--vscode-editor-background)'
const config: Config = {
  axis: {
    domain: false,
    gridOpacity: 0.25,
    tickColor: foregroundColor,
    titleColor: foregroundColor
  },
  background: backgroundColor,
  mark: {
    stroke: foregroundColor
  },
  padding: 10,
  rule: {
    stroke: foregroundColor
  },
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

const PlotContainer = ({
  component,
  title
}: {
  component: JSX.Element
  title: string
}) => {
  return (
    <div>
      <div className={styles.centered}>
        <h1>{title}</h1>
      </div>
      <div className={styles.centered}>{component}</div>
    </div>
  )
}

const Plot = ({
  values,
  title
}: {
  values: { x: number; y: number; group: string }[]
  title: string
}) => {
  const spec = createSpec(title)

  return (
    <VegaLite
      actions={false}
      config={config}
      spec={spec}
      data={{ values }}
      renderer="svg"
    />
  )
}

const LivePlots = ({ plots }: { plots: LivePlotData[] }) => {
  if (!plots.length) {
    return <></>
  }

  return (
    <PlotContainer
      title="Live Experiments Plots"
      component={
        <>
          {plots.map(plotData => (
            <Plot
              values={plotData.values}
              title={plotData.title}
              key={`plot-${plotData.title}`}
            />
          ))}
        </>
      }
    />
  )
}

const StaticPlots = ({
  plots
}: {
  plots: Record<string, VisualizationSpec>
}) => {
  const entries = Object.entries(plots || {})
  if (!entries.length) {
    return <></>
  }

  return (
    <PlotContainer
      component={
        <>
          {Object.entries(plots || {})?.map(([path, spec]) => (
            <VegaLite
              actions={false}
              config={config}
              spec={spec}
              renderer="svg"
              key={`plot-${path}`}
            />
          ))}
        </>
      }
      title="Static Plots"
    />
  )
}

const EmptyState = (text: string) => {
  return (
    <div className={cx(styles.centered, styles.fullScreen)}>
      <p className={styles.emptyStateText}>{text}</p>
    </div>
  )
}

const Plots = ({ plotsData }: { plotsData?: PlotsData }) => {
  if (!plotsData) {
    return EmptyState('Loading Plots...')
  }

  if (isEmpty(plotsData?.live) && isEmpty(plotsData?.static)) {
    return EmptyState('No Plots to Display')
  }

  return (
    <>
      <LivePlots plots={plotsData.live} />
      <StaticPlots plots={plotsData.static} />
    </>
  )
}

export default Plots
