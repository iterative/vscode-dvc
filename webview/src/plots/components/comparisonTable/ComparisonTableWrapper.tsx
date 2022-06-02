import { PlotsComparisonData, Section } from 'dvc/src/plots/webview/contract'
import React from 'react'
import { ComparisonTable } from './ComparisonTable'
import { BasicContainerProps, PlotsContainer } from '../PlotsContainer'

interface ComparisonTableWrapper {
  comparisonTable: PlotsComparisonData
  basicContainerProps: BasicContainerProps
}

export const ComparisonTableWrapper: React.FC<ComparisonTableWrapper> = ({
  comparisonTable,
  basicContainerProps
}) => {
  const { revisions, sectionName, size, plots } = comparisonTable

  return (
    <PlotsContainer
      title={sectionName}
      sectionKey={Section.COMPARISON_TABLE}
      currentSize={size}
      {...basicContainerProps}
    >
      <ComparisonTable plots={plots} revisions={revisions} />
    </PlotsContainer>
  )
}
