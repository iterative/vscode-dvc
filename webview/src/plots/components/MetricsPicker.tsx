import React, { useState } from 'react'
import { SelectMenu } from '../../shared/components/selectMenu/SelectMenu'
import { SelectMenuOptionProps } from '../../shared/components/selectMenu/SelectMenuOption'

export const MetricsPicker: React.FC<{
  metrics: string[]
  selectedMetrics: string[]
  setSelectedMetrics: (selectedMetrics: string[]) => void
}> = ({ metrics, selectedMetrics, setSelectedMetrics }) => {
  const [options, setOptions] = useState<SelectMenuOptionProps[]>(
    metrics.map(metric => ({
      id: metric,
      isSelected: selectedMetrics.includes(metric),
      label: metric
    }))
  )
  const onClick = (id: string) => {
    const rebuiltOptions = options.map(option =>
      option.id === id ? { ...option, isSelected: !option.isSelected } : option
    )
    setOptions(rebuiltOptions)
    setSelectedMetrics(
      rebuiltOptions
        .filter(option => option.isSelected)
        .map(option => option.id)
    )
  }
  return <SelectMenu options={options} onClick={onClick} />
}
