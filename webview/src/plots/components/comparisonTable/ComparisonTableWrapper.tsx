import { PlotsComparisonData, Section } from 'dvc/src/plots/webview/contract'
import React, { useState } from 'react'
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
  // eslint-disable-next-line sonarjs/cognitive-complexity
}) => {
  const allRevisions = comparisonTable.revisions?.map(rev => rev.revision) || []
  const [selectedPlots, setSelectedPlots] = useState<string[]>(allRevisions)

  const plots = comparisonTable.plots.filter(plot => {
    const plotRevisions = Object.values(plot.revisions)
    for (const plotRevision of plotRevisions) {
      if (selectedPlots.includes(plotRevision.revision)) {
        return true
      }
    }
    return false
  })

  return (
    <PlotsContainer
      title={comparisonTable.sectionName}
      sectionKey={Section.COMPARISON_TABLE}
      menu={{
        plots: allRevisions,
        selectedPlots: selectedPlots,
        setSelectedPlots
      }}
      currentSize={comparisonTable.size}
      {...basicContainerProps}
    >
      {plots.length > 0 ? (
        <ComparisonTable
          plots={plots}
          revisions={comparisonTable.revisions.filter(rev =>
            selectedPlots.includes(rev.revision)
          )}
        />
      ) : (
        <EmptyState isFullScreen={false}>No Revisions to Show</EmptyState>
      )}
    </PlotsContainer>
  )
}
