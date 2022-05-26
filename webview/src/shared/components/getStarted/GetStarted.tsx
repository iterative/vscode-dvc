import React from 'react'
import { EmptyState } from '../emptyState/EmptyState'

export type GetStartedProps = {
  addItems: React.ReactNode
  showEmpty: boolean
  welcome: React.ReactNode
}

export const GetStarted: React.FC<GetStartedProps> = ({
  addItems,
  welcome,
  showEmpty
}: GetStartedProps) => {
  if (!showEmpty) {
    return <EmptyState>{addItems}</EmptyState>
  }

  return <EmptyState>{welcome}</EmptyState>
}
