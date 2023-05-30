import React from 'react'
import { SupportedStorage } from './SupportedStorage'
import { EmptyState } from '../../../shared/components/emptyState/EmptyState'
import { FocusDvcSection } from '../shared/FocusDvcSection'

export const DvcUninitialized: React.FC<{}> = () => (
  <EmptyState isFullScreen={false}>
    <h1>DVC is not initialized</h1>
    <FocusDvcSection />
    <SupportedStorage />
  </EmptyState>
)
