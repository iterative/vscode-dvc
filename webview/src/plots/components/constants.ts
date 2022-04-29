import { Config, FontWeight } from 'vega'
import { getThemeValue, ThemeProperty } from '../../util/styles'

const foregroundColor = getThemeValue(ThemeProperty.FOREGROUND_COLOR)
const backgroundColor = 'var(--vscode-editor-foreground-transparency-1)'
const font = getThemeValue(ThemeProperty.FONT_FAMILY)
const fontWeight = 'normal' as FontWeight

const title = {
  font,
  fontSize: 16,
  fontWeight
}

export const config: Config = {
  axis: {
    domain: false,
    gridColor: foregroundColor,
    gridOpacity: 0.25,
    labelAngle: 0,
    tickColor: foregroundColor,
    titleColor: foregroundColor,
    titlePadding: 15
  },
  background: backgroundColor,
  mark: {
    stroke: foregroundColor
  },
  padding: 20,
  rule: {
    stroke: foregroundColor
  },
  style: {
    cell: {
      stroke: foregroundColor
    },
    'group-title': {
      fill: foregroundColor,
      stroke: foregroundColor,
      ...title
    },
    'guide-label': {
      fill: foregroundColor,
      font,
      fontWeight,
      stroke: foregroundColor
    },
    'guide-title': {
      fill: foregroundColor,
      stroke: foregroundColor,
      ...title
    },
    rule: {
      fill: foregroundColor,
      stroke: foregroundColor
    }
  }
}
