import { DetailedHTMLProps, HTMLAttributes } from 'react'

export const withScale = (scale: number) =>
  ({ '--scale': scale }) as DetailedHTMLProps<
    HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  >

export const withVariant = (variant: number) =>
  ({ '--variant': variant }) as DetailedHTMLProps<
    HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  >

export enum ThemeProperty {
  BACKGROUND_COLOR = '--vscode-editor-background',
  FOREGROUND_COLOR = '--vscode-editor-foreground',
  MENU_BACKGROUND = '--vscode-menu-background',
  ACCENT_COLOR = '--button-primary-background',
  FONT = '--vscode-editor-font-family'
}

export const getThemeValue = (property: ThemeProperty) =>
  getComputedStyle(document.documentElement).getPropertyValue(property).trim()

export const replaceThemeValuesForExport = (
  svg: string,
  properties: ThemeProperty[]
): string => {
  let themedSvg = svg
  for (const property of properties) {
    themedSvg = themedSvg.replace(
      new RegExp(`var\\(${property}\\)`, 'g'),
      getThemeValue(property)
    )
  }
  return themedSvg
}

const replaceFirstTwoInstances = (
  svg: string,
  heightOrWidth: 'height' | 'width'
): string => {
  let counter = 0
  return svg.replace(new RegExp(`${heightOrWidth}="\\d+"`, 'g'), match => {
    counter = counter + 1
    return counter <= 2 ? `${heightOrWidth}="100%"` : match
  })
}

export const preventSvgTruncation = (svg: string): string => {
  const heightTruncationRemoved = replaceFirstTwoInstances(svg, 'height')
  const widthTruncationRemoved = replaceFirstTwoInstances(
    heightTruncationRemoved,
    'width'
  )
  return widthTruncationRemoved.replace(/viewBox=".*?"/, '')
}

export const alphaToHex = (color: string, alpha: number): string => {
  const fullColor: string = color.length === 4 ? color + color.slice(-3) : color
  return `${fullColor}${(Math.round(alpha * 255) + 0x10000)
    .toString(16)
    .slice(-2)}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return
export const getStyleProperty = (propAsString: string) => propAsString as any

export const hexToRGB = (hex: string) =>
  `rgb(${Number.parseInt(hex.slice(1, 3), 16)}, ${Number.parseInt(
    hex.slice(4, 6),
    16
  )}, ${Number.parseInt(hex.slice(-2), 16)})`
