import React, { useEffect, useState } from 'react'
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
    setOptions(
      options.map(option =>
        option.id === id
          ? { ...option, isSelected: !option.isSelected }
          : option
      )
    )
  }
  useEffect(() => {
    setSelectedMetrics(
      options.filter(option => option.isSelected).map(option => option.id)
    )
  }, [options, setSelectedMetrics])
  return <SelectMenu options={options} onClick={onClick} />
}
