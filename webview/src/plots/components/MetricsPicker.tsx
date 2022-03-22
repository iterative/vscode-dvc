import React from 'react'
import { MultiSelect } from '../../shared/components/SelectMenu/MultiSelect'

export const MetricsPicker: React.FC<{
  metrics: string[]
  selectedMetrics: string[]
  setSelectedMetrics: (selectedMetrics: string[]) => void
}> = ({ metrics, selectedMetrics, setSelectedMetrics }) => {
  const items = metrics.map(metric => ({
    id: metric,
    isSelected: selectedMetrics.includes(metric),
    label: metric
  }))
  return <MultiSelect items={items} setSelected={setSelectedMetrics} />
}
