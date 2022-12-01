import { Revision } from 'dvc/src/plots/webview/contract'
import React from 'react'
import { EmptyState } from '../../shared/components/emptyState/EmptyState'

export const sectionIsLoading = (selectedRevisions: Revision[]): boolean =>
  selectedRevisions.length > 0 &&
  !selectedRevisions.some(({ fetched }) => fetched)

export const LoadingSection: React.FC = () => (
  <EmptyState isFullScreen={false}>Loading...</EmptyState>
)
