import { PlotSize, Section } from 'dvc/src/plots/webview/contract'
import React, { createContext, useState } from 'react'

export type DraggedInfo =
  | {
      itemIndex: string
      itemId: string
      group: string
    }
  | undefined

export type Sizes = Record<Section, PlotSize>

export interface PlotsSizeContextValue {
  sizes: Sizes
  changePlotsSizes: ((size: PlotSize, section: Section) => void) | undefined
}

export const PlotsSizeContext = createContext<PlotsSizeContextValue>({
  changePlotsSizes: undefined,
  sizes: {
    [Section.CHECKPOINT_PLOTS]: PlotSize.REGULAR,
    [Section.TEMPLATE_PLOTS]: PlotSize.REGULAR,
    [Section.COMPARISON_TABLE]: PlotSize.REGULAR
  }
})

export const PlotsSizeProvider: React.FC<
  Omit<PlotsSizeContextValue, 'changePlotsSizes'>
> = ({ children, sizes: allSizes }) => {
  const [sizes, setSizes] = useState<Sizes>(allSizes)

  const changePlotsSizes = (size: PlotSize, section: Section) =>
    setSizes(plotSizes => ({ ...plotSizes, [section]: size }))

  return (
    <PlotsSizeContext.Provider value={{ changePlotsSizes, sizes }}>
      {children}
    </PlotsSizeContext.Provider>
  )
}
