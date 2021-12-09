import React from 'react'
import { SelectMenuOptionProps } from '../../shared/components/selectMenu/SelectMenuOption'
import { SingleSelect } from '../../shared/components/selectMenu/SingleSelect'
import { capitalize } from '../../util/strings'

export const PlotSize = {
  LARGE: 'LARGE',
  REGULAR: 'REGULAR',
  SMALL: 'SMALL'
}

type PlotSizeKeys = keyof typeof PlotSize
export type PlotSize = typeof PlotSize[PlotSizeKeys]

export const SizePicker: React.FC<{
  currentSize: string
  setSelectedSize: (selectedSize: string) => void
}> = ({ currentSize, setSelectedSize }) => {
  const options: SelectMenuOptionProps[] = Object.keys(PlotSize).map(
    plotSize => {
      const size = PlotSize[plotSize as keyof typeof PlotSize]
      return {
        id: size,
        isSelected: currentSize === size,
        label: capitalize(size)
      }
    }
  )
  return <SingleSelect items={options} setSelected={setSelectedSize} />
}
