import React from 'react'
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
  const items = plots.map(plot => ({
    id: plot,
    isSelected: selectedPlots.includes(plot),
    label: plot
  }))
  return <MultiSelect items={items} setSelected={setSelectedPlots} />
}
