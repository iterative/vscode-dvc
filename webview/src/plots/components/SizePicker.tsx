import React from 'react'
import { PlotDimensions } from './constants'
import { SelectMenuOptionProps } from '../../shared/components/selectMenu/SelectMenuOption'
import { SingleSelect } from '../../shared/components/selectMenu/SingleSelect'
import { capitalize } from '../../util/strings'

export const PlotSize: { [key: string]: keyof typeof PlotDimensions } = {
  LARGE: 'LARGE',
  REGULAR: 'REGULAR',
  SMALL: 'SMALL'
}

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
