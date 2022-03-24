import { PlotSize } from 'dvc/src/plots/webview/contract'
import React from 'react'
import { SelectMenuOptionProps } from '../../shared/components/selectMenu1/SelectMenuOption'
import { SingleSelect } from '../../shared/components/selectMenu1/SingleSelect'
import { capitalize } from '../../util/strings'

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
