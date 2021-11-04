import React from 'react'
import { LivePlotData, PlotsData } from 'dvc/src/plots/webview/contract'
import { VegaLite, VisualizationSpec } from 'react-vega'
import { Config } from 'vega'

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
  return (
    <>
      {plots.map(plotData => (
        <Plot
          values={plotData.values}
          title={plotData.title}
          key={`plot-${plotData.title}`}
        />
      ))}
    </>
  )
}

const StaticPlots = ({
  plots
}: {
  plots: Record<string, VisualizationSpec>
}) => {
  return (
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
  )
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
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}
      >
        <h1>{title}</h1>
      </div>
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}
      >
        {component}
      </div>
    </div>
  )
}

const Plots = ({ plotsData }: { plotsData?: PlotsData }) => {
  if (plotsData) {
    return (
      <>
        <PlotContainer
          component={<LivePlots plots={plotsData.live} />}
          title="Live Experiments Plots"
        />
        <PlotContainer
          component={<StaticPlots plots={plotsData.static} />}
          title="Static Plots"
        />
      </>
    )
  }
  return <></>
}
export default Plots
