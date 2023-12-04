import { Config } from 'vega-lite'
import { PlainObject, VisualizationSpec } from 'react-vega'
import { VegaLiteProps } from 'react-vega/lib/VegaLite'
import { ThemeProperty } from '../../util/styles'

export const PlOT_FOREGROUND_COLOR = `var(${ThemeProperty.FOREGROUND_COLOR})`
const PLOT_BACKGROUND_COLOR = 'transparent'
export const PLOT_FONT = `var(${ThemeProperty.FONT})`
const PLOT_FONT_WEIGHT = 'normal' as const

const title = {
  fill: PlOT_FOREGROUND_COLOR,
  font: PLOT_FONT,
  fontSize: 12,
  fontWeight: PLOT_FONT_WEIGHT
}

const config: Config = {
  axis: {
    domain: false,
    gridColor: PlOT_FOREGROUND_COLOR,
    gridOpacity: 0.25,
    tickColor: PlOT_FOREGROUND_COLOR,
    titleColor: PlOT_FOREGROUND_COLOR,
    titlePadding: 15
  },
  background: PLOT_BACKGROUND_COLOR,

  padding: 20,
  style: {
    cell: {
      stroke: PlOT_FOREGROUND_COLOR
    },
    'group-title': title,
    'guide-label': {
      fill: PlOT_FOREGROUND_COLOR,
      font: PLOT_FONT,
      fontWeight: PLOT_FONT_WEIGHT
    },
    'guide-title': title
  },
  title: {
    color: PlOT_FOREGROUND_COLOR,
    subtitleColor: PlOT_FOREGROUND_COLOR
  }
}

export const createPlotProps = (
  data: PlainObject | undefined,
  id: string,
  spec: VisualizationSpec | undefined
) =>
  ({
    actions: false,
    config,
    data,
    'data-testid': `${id}-vega`,
    renderer: 'svg',
    spec
  }) as VegaLiteProps
