import React from 'react'
import { EmptyState } from '../emptyState/EmptyState'

export type GetStartedProps = {
  addItems: React.ReactNode
  showEmpty: boolean
  empty: React.ReactNode
}

export const GetStarted = ({ addItems, empty, showEmpty }: GetStartedProps) => {
  if (!showEmpty) {
    return <EmptyState>{addItems}</EmptyState>
  }

  return <EmptyState>{empty}</EmptyState>
}
