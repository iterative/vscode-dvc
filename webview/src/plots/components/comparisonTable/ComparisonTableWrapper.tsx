import { PlotsComparisonData, Section } from 'dvc/src/plots/webview/contract'
import React from 'react'
import { ComparisonTable } from './ComparisonTable'
import { BasicContainerProps, PlotsContainer } from '../PlotsContainer'
import { EmptyState } from '../../../shared/components/emptyState/EmptyState'

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
      {plots.length > 0 ? (
        <ComparisonTable plots={plots} revisions={revisions} />
      ) : (
        <EmptyState isFullScreen={false}>No Revisions to Show</EmptyState>
      )}
    </PlotsContainer>
  )
}
