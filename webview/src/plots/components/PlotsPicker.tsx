import React, { useState, useCallback, useEffect } from 'react'
import { MultiSelect } from '../../shared/components/selectMenu/MultiSelect'

export interface PlotsPickerProps {
  plots: string[]
  selectedPlots: string[]
  setSelectedPlots: (selectedPlots: string[]) => void
}

export const PlotsPicker: React.FC<PlotsPickerProps> = ({
  plots,
  selectedPlots,
  setSelectedPlots
}) => {
  const getItems = useCallback(
    () =>
      plots.map(plot => ({
        id: plot,
        isSelected: selectedPlots.includes(plot),
        label: plot
      })),
    [plots, selectedPlots]
  )

  const [items, setItems] = useState(getItems())
  useEffect(() => {
    setItems(getItems())
  }, [plots, setItems, getItems])
  return <MultiSelect items={items} setSelected={setSelectedPlots} />
}
