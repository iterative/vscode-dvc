import { DetailedHTMLProps, HTMLAttributes } from 'react'

export const withScale = (scale: number) =>
  ({ '--scale': scale } as DetailedHTMLProps<
    HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  >)

export enum ThemeProperty {
  BACKGROUND_COLOR = '--vscode-editor-background',
  FOREGROUND_COLOR = '--vscode-editor-foreground'
}

export const getThemeValue = (property: ThemeProperty) =>
  getComputedStyle(document.documentElement).getPropertyValue(property)
