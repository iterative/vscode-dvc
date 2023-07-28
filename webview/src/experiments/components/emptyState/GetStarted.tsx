import React from 'react'
import { Welcome } from './Welcome'
import { AddColumns } from './AddColumns'
import { RemoveFilters } from './RemoveFilters'
import { EmptyState } from '../../../shared/components/emptyState/EmptyState'

export const GetStarted: React.FC<{
  hasColumns: boolean
  hasOnlyDefaultColumns: boolean
  hasRows: boolean
  hasFilters: boolean
}> = ({ hasColumns, hasFilters, hasOnlyDefaultColumns, hasRows }) => {
  if (hasColumns && hasOnlyDefaultColumns) {
    return (
      <EmptyState>
        <AddColumns />
      </EmptyState>
    )
  }

  if (!hasRows && hasFilters) {
    return (
      <EmptyState>
        <RemoveFilters />
      </EmptyState>
    )
  }

  return (
    <EmptyState>
      <Welcome />
    </EmptyState>
  )
}
