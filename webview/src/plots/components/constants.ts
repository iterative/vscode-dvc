import { Config, FontWeight } from 'vega'

const foregroundColor = 'var(--vscode-editor-foreground)'
const backgroundColor = 'var(--vscode-editor-foreground-transparency-1)'
const font = 'var(--vscode-editor-font-family)'
const fontWeight = 'normal' as FontWeight

const title = {
  fill: foregroundColor,
  font,
  fontSize: 12,
  fontWeight
}

export const config: Config = {
  axis: {
    domain: false,
    domainColor: foregroundColor,
    gridColor: foregroundColor,
    gridOpacity: 0.25,
    tickColor: foregroundColor,
    titlePadding: 15
  },
  background: backgroundColor,

  padding: 20,
  style: {
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
