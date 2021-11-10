import React, { Dispatch } from 'react'
import cx from 'classnames'
import {
  LivePlotsColors,
  LivePlotData,
  PlotsData
} from 'dvc/src/plots/webview/contract'
import { VegaLite, VisualizationSpec } from 'react-vega'
import { isEmpty } from 'lodash'
import { Config } from 'vega'
import styles from './styles.module.scss'
import {
  CollapsibleSectionsActions,
  CollapsibleSectionsKeys,
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
      color: scale
        ? {
            field: 'symbol',
            scale,
            type: 'nominal'
          }
        : undefined,
      x: { field: 'x', title: 'iteration', type: 'nominal' }
    },
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

const PlotsContainer: React.FC<{
  collapsedSections: CollapsibleSectionsState
  sectionKey: CollapsibleSectionsKeys
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
  colors?: LivePlotsColors
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

const StaticPlots = ({ plots }: { plots: [string, VisualizationSpec][] }) => (
  <>
    {plots.map(([path, spec]) => (
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

const EmptyState = (text: string) => {
  return (
    <div className={cx(styles.centered, styles.fullScreen)}>
      <p className={styles.emptyStateText}>{text}</p>
    </div>
  )
}

const getPlotsFromData = (
  data: PlotsData
): {
  livePlots: LivePlotData[] | undefined
  staticPlots: [string, VisualizationSpec][] | undefined
} => {
  const livePlots = data.live?.plots
  const staticPlots = data.static && Object.entries(data.static)
  return {
    livePlots: isEmpty(livePlots) ? undefined : livePlots,
    staticPlots: isEmpty(staticPlots) ? undefined : staticPlots
  }
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

  const { livePlots, staticPlots } = getPlotsFromData(data)

  if (!livePlots && !staticPlots) {
    return EmptyState('No Plots to Display')
  }

  return (
    <>
      {livePlots && (
        <PlotsContainer
          title="Live Experiments Plots"
          sectionKey={CollapsibleSectionsKeys.LIVE_PLOTS}
          collapsedSections={collapsedSections}
          dispatch={dispatch}
        >
          <LivePlots plots={livePlots} colors={data.live?.colors} />
        </PlotsContainer>
      )}
      {staticPlots && (
        <PlotsContainer
          title="Static Plots"
          sectionKey={CollapsibleSectionsKeys.STATIC_PLOTS}
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
