import React from 'react'
import { EmptyState } from '../emptyState/EmptyState'

type GetStartedProps = {
  addItems: React.ReactNode
  showEmpty: boolean
  welcome: React.ReactNode
  isFullScreen?: boolean
}

export const GetStarted: React.FC<GetStartedProps> = ({
  addItems,
  welcome,
  showEmpty,
  isFullScreen
}: GetStartedProps) => {
  if (!showEmpty) {
    return <EmptyState isFullScreen={isFullScreen}>{addItems}</EmptyState>
  }

  return <EmptyState isFullScreen={isFullScreen}>{welcome}</EmptyState>
}
