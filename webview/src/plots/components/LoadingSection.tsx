import { Revision } from 'dvc/src/plots/webview/contract'
import React from 'react'
import { EmptyState } from '../../shared/components/emptyState/EmptyState'

export const sectionIsLoading = (
  selectedRevisions: Revision[],
  hasData: boolean
): boolean =>
  selectedRevisions.length > 0 &&
  !selectedRevisions.some(({ fetched }) => fetched) &&
  !hasData

export const LoadingSection: React.FC = () => (
  <EmptyState isFullScreen={false}>Loading...</EmptyState>
)
