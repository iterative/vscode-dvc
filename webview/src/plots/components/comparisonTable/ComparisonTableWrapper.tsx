import { PlotsComparisonData, Section } from 'dvc/src/plots/webview/contract'
import React, { useEffect, useState } from 'react'
import { ComparisonTable } from './ComparisonTable'
import { BasicContainerProps, PlotsContainer } from '../PlotsContainer'
import { EmptyState } from '../../../shared/components/emptyState/EmptyState'

interface ComparisonTableWrapper {
  comparisonTable: PlotsComparisonData
  basicContainerProps: BasicContainerProps
}

// eslint-disable-next-line sonarjs/cognitive-complexity
export const ComparisonTableWrapper: React.FC<ComparisonTableWrapper> = ({
  comparisonTable,
  basicContainerProps
}) => {
  const { revisions: revs, sectionName, size } = comparisonTable
  const [allRevisions, setAllRevisions] = useState(
    revs?.map(rev => rev.revision) || []
  )
  const [selectedPlots, setSelectedPlots] = useState<string[]>(allRevisions)

  useEffect(() => {
    setAllRevisions(allRevs => {
      const revisionStrings = revs?.map(rev => rev.revision)
      const newRevisions = revisionStrings.filter(rev => !allRevs.includes(rev))
      setSelectedPlots(plots => {
        const filteredRevisions = plots.filter(plot =>
          revisionStrings.includes(plot)
        )
        return [...filteredRevisions, ...newRevisions]
      })

      return revisionStrings || []
    })
  }, [revs, setAllRevisions, setSelectedPlots])

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
      title={sectionName}
      sectionKey={Section.COMPARISON_TABLE}
      menu={{
        plots: allRevisions,
        selectedPlots: selectedPlots,
        setSelectedPlots
      }}
      currentSize={size}
      {...basicContainerProps}
    >
      {plots.length > 0 ? (
        <ComparisonTable
          plots={plots}
          revisions={revs.filter(rev => selectedPlots.includes(rev.revision))}
        />
      ) : (
        <EmptyState isFullScreen={false}>No Revisions to Show</EmptyState>
      )}
    </PlotsContainer>
  )
}
