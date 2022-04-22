import { PlotsComparisonData, Section } from 'dvc/src/plots/webview/contract'
import React, { useEffect, useState } from 'react'
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
  const [revisions, setRevisions] = useState<string[]>([])
  const [selectedPlots, setSelectedPlots] = useState<string[]>([])

  useEffect(() => {
    const allRevisions =
      comparisonTable.revisions?.map(rev => rev.revision) || []
    setRevisions(allRevisions)
    setSelectedPlots(allRevisions)
  }, [comparisonTable, setSelectedPlots, setRevisions])

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
        plots: revisions,
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
