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
  return (
    <PlotsContainer
      title={comparisonTable.sectionName}
      sectionKey={Section.COMPARISON_TABLE}
      currentSize={comparisonTable.size}
      {...basicContainerProps}
    >
      <ComparisonTable
        plots={comparisonTable.plots}
        revisions={comparisonTable.revisions}
      />
    </PlotsContainer>
  )
}
