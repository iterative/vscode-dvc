import { Config } from 'vega-lite'

const foregroundColor = 'var(--vscode-editor-foreground)'
const backgroundColor = 'var(--vscode-editor-foreground-transparency-1)'
const font = 'var(--vscode-editor-font-family)'
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
