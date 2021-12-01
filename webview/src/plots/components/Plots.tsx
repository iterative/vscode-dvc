import React, { Dispatch } from 'react'
import cx from 'classnames'
import {
  LivePlotsColors,
  LivePlotData,
  PlotsOutput,
  PlotsType,
  StaticPlot,
  StaticVegaPlot
} from 'dvc/src/plots/webview/contract'
import { VegaLite, VisualizationSpec } from 'react-vega'
import { Config } from 'vega'
import styles from './styles.module.scss'
import {
  CollapsibleSectionsActions,
  PlotsSectionKeys,
  CollapsibleSectionsState,
  PlotsReducerAction,
  PlotsWebviewState
} from '../hooks/useAppReducer'

const createSpec = (
  title: string,
  scale?: LivePlotsColors
): VisualizationSpec => {
  return {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: { name: 'values' },
    encoding: {
      x: { field: 'x', title: 'iteration', type: 'nominal' }
    },
    height: 300,
    layer: [
      {
        encoding: {
          color: { field: 'group', legend: null, scale, type: 'nominal' },
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

const PlotsContainer: React.FC<{
  collapsedSections: CollapsibleSectionsState
  sectionKey: PlotsSectionKeys
  dispatch: Dispatch<PlotsReducerAction>
  title: string
}> = ({ collapsedSections, sectionKey, dispatch, title, children }) => {
  const open = !collapsedSections[sectionKey]
  return (
    <details open={open} className={styles.plotsContainer}>
      <summary
        onClick={e => {
          e.preventDefault()
          dispatch({
            sectionKey,
            type: CollapsibleSectionsActions.TOGGLE_COLLAPSED
          })
        }}
      >
        {title}
      </summary>
      <div className={styles.centered}>{open && children}</div>
    </details>
  )
}

const Plot = ({
  values,
  title,
  scale
}: {
  values: { x: number; y: number; group: string }[]
  title: string
  scale?: LivePlotsColors
}) => {
  const spec = createSpec(title, scale)

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

const LivePlots = ({
  plots,
  colors
}: {
  plots: LivePlotData[]
  colors: LivePlotsColors
}) => (
  <>
    {plots.map(plotData => (
      <Plot
        values={plotData.values}
        title={plotData.title}
        scale={colors}
        key={`plot-${plotData.title}`}
      />
    ))}
  </>
)
const isVega = (plot: StaticPlot): plot is StaticVegaPlot =>
  plot.type === PlotsType.VEGA

const StaticPlots = ({ plots }: { plots: PlotsOutput }) => (
  <>
    {Object.entries(plots).map(([path, plots]) =>
      plots.map(plot =>
        isVega(plot) ? (
          <VegaLite
            actions={false}
            config={config}
            spec={plot.content}
            renderer="svg"
            key={`plot-${path}`}
          />
        ) : (
          <></>
        )
      )
    )}
  </>
)

const EmptyState = (text: string) => {
  return (
    <div className={cx(styles.centered, styles.fullScreen)}>
      <p className={styles.emptyStateText}>{text}</p>
    </div>
  )
}

const Plots = ({
  state,
  dispatch
}: {
  state: PlotsWebviewState
  dispatch: Dispatch<PlotsReducerAction>
}) => {
  const { data, collapsedSections } = state

  if (!data) {
    return EmptyState('Loading Plots...')
  }

  const { live: livePlots, static: staticPlots } = data

  if (!livePlots && !staticPlots) {
    return EmptyState('No Plots to Display')
  }

  return (
    <>
      {livePlots && (
        <PlotsContainer
          title="Live Experiments Plots"
          sectionKey={PlotsSectionKeys.LIVE_PLOTS}
          collapsedSections={collapsedSections}
          dispatch={dispatch}
        >
          <LivePlots plots={livePlots.plots} colors={livePlots.colors} />
        </PlotsContainer>
      )}
      {staticPlots && (
        <PlotsContainer
          title="Static Plots"
          sectionKey={PlotsSectionKeys.STATIC_PLOTS}
          collapsedSections={collapsedSections}
          dispatch={dispatch}
        >
          <StaticPlots plots={staticPlots} />
        </PlotsContainer>
      )}
    </>
  )
}

export default Plots
