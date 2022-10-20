import { PlotSizeNumber } from 'dvc/src/plots/webview/contract'
import React from 'react'
import { SelectMenuOptionProps } from '../../shared/components/selectMenu/SelectMenuOption'
import { SingleSelect } from '../../shared/components/selectMenu/SingleSelect'

export const PlotSize = {
  LARGE: 'Large',
  REGULAR: 'Regular',
  SMALL: 'Small'
}

type PlotSizeKeys = keyof typeof PlotSize
export type PlotSize = typeof PlotSize[PlotSizeKeys]

export const SizePicker: React.FC<{
  currentSize: number
  setSelectedSize: (selectedSize: number) => void
}> = ({ currentSize, setSelectedSize }) => {
  const numericalSize = {
    [PlotSize.LARGE]: `${PlotSizeNumber.LARGE}`,
    [PlotSize.REGULAR]: `${PlotSizeNumber.REGULAR}`,
    [PlotSize.SMALL]: `${PlotSizeNumber.SMALL}`
  }
  const options: SelectMenuOptionProps[] = Object.keys(PlotSize).map(
    plotSize => {
      const size = PlotSize[plotSize as keyof typeof PlotSize]
      const sizeInPixels = numericalSize[size]
      return {
        id: sizeInPixels,
        isSelected: currentSize.toString() === sizeInPixels,
        label: size
      }
    }
  )
  const handleSizeChange = (size: string) =>
    setSelectedSize(Number.parseInt(size, 10))
  return <SingleSelect items={options} setSelected={handleSizeChange} />
}
