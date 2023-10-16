import { Config } from 'vega-lite'
import { ThemeProperty } from '../../util/styles'

const foregroundColor = `var(${ThemeProperty.FOREGROUND_COLOR})`
const backgroundColor = 'transparent'
const font = `var(${ThemeProperty.FONT})`
const fontWeight = 'normal' as const

const title = {
  fill: foregroundColor,
  font,
  fontSize: 12,
  fontWeight
}

export const config: Config = {
  axis: {
    domain: false,
    gridColor: foregroundColor,
    gridOpacity: 0.25,
    tickColor: foregroundColor,
    titleColor: foregroundColor,
    titlePadding: 15
  },
  background: backgroundColor,

  padding: 20,
  style: {
    cell: {
      stroke: foregroundColor
    },
    'group-title': title,
    'guide-label': {
      fill: foregroundColor,
      font,
      fontWeight
    },
    'guide-title': title
  },
  title: {
    color: foregroundColor,
    subtitleColor: foregroundColor
  }
}
